package com.hobby.hub.controller;

import com.hobby.hub.model.ChatMessage;
import com.hobby.hub.model.User;
import com.hobby.hub.repository.ChatMessageRepository;
import com.hobby.hub.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/chatrooms")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // hobby (lowercase) -> list of active SseEmitters
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> emittersByRoom = new ConcurrentHashMap<>();

    private static final List<RoomMeta> DEFAULT_ROOMS = List.of(
            new RoomMeta("Coding", "💻", "Coding", "Talk code with devs"),
            new RoomMeta("Chess", "♟️", "Chess", "Discuss openings and games"),
            new RoomMeta("Drawing", "🎨", "Drawing", "Share your art"),
            new RoomMeta("Gaming", "🎮", "Gaming", "Squad up and play"),
            new RoomMeta("Music", "🎵", "Music", "Talk tracks and gear"),
            new RoomMeta("Fitness", "🏋️", "Fitness", "Share your progress")
    );

    public record RoomMeta(String id, String icon, String title, String subtitle) {}
    public record ChatroomView(String id, String icon, String title, String subtitle, List<ChatMessage> messages) {}

    @GetMapping
    public List<ChatroomView> getChatrooms() {
        List<ChatroomView> list = new ArrayList<>();
        for (RoomMeta meta : DEFAULT_ROOMS) {
            List<ChatMessage> msgs = chatMessageRepository.findByHobby(meta.id(), 100);
            list.add(new ChatroomView(meta.id(), meta.icon(), meta.title(), meta.subtitle(), msgs));
        }
        return list;
    }

    @GetMapping("/{hobby}/messages")
    public List<ChatMessage> getMessages(@PathVariable String hobby) {
        return chatMessageRepository.findByHobby(hobby, 100);
    }

    @GetMapping(value = "/{hobby}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable String hobby) {
        String key = hobby.toLowerCase();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        CopyOnWriteArrayList<SseEmitter> list = emittersByRoom.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>());
        list.add(emitter);

        Runnable cleanup = () -> {
            CopyOnWriteArrayList<SseEmitter> roomList = emittersByRoom.get(key);
            if (roomList != null) {
                roomList.remove(emitter);
            }
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("status", "connected", "hobby", hobby)));
        } catch (Exception e) {
            cleanup.run();
        }

        return emitter;
    }

    @PostMapping("/{hobby}/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable String hobby,
            @RequestBody Map<String, String> body,
            HttpSession session
    ) {
        String text = body.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Message text cannot be empty"));
        }

        Long userId = (Long) session.getAttribute("userId");
        String sessionUser = (String) session.getAttribute("username");

        if (userId != null) {
            boolean isBanned = userRepository.findById(userId).map(User::isBanned).orElse(false);
            if (isBanned) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("status", "ERROR", "message", "Your account has been banned"));
            }
        }

        String author = (sessionUser != null && !sessionUser.isBlank())
                ? sessionUser
                : (body.get("author") != null && !body.get("author").isBlank() ? body.get("author") : "Anonymous");

        ChatMessage saved = chatMessageRepository.save(hobby, userId, author, text.trim());

        // Broadcast to all active live listeners in this room
        String key = hobby.toLowerCase();
        CopyOnWriteArrayList<SseEmitter> roomEmitters = emittersByRoom.get(key);
        if (roomEmitters != null && !roomEmitters.isEmpty()) {
            List<SseEmitter> deadList = new ArrayList<>();
            for (SseEmitter emitter : roomEmitters) {
                try {
                    emitter.send(SseEmitter.event().name("message").data(saved));
                } catch (Exception e) {
                    deadList.add(emitter);
                }
            }
            if (!deadList.isEmpty()) {
                roomEmitters.removeAll(deadList);
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Keep-alive heartbeat every 25 seconds across all rooms
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        for (Map.Entry<String, CopyOnWriteArrayList<SseEmitter>> entry : emittersByRoom.entrySet()) {
            CopyOnWriteArrayList<SseEmitter> list = entry.getValue();
            List<SseEmitter> dead = new ArrayList<>();
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    dead.add(emitter);
                }
            }
            if (!dead.isEmpty()) {
                list.removeAll(dead);
            }
        }
    }
}
