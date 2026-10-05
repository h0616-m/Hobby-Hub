package com.hobby.hub.config;

import com.hobby.hub.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Autowired
    private UserRepository userRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/*.html", "/*.js", "/*.css", "/favicon.ico").permitAll()
                        .requestMatchers("/api/**").permitAll()
                        .anyRequest().permitAll()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(googleLoginSuccessHandler())
                        .failureHandler(googleLoginFailureHandler())
                );
        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://hobby-hub-nine.vercel.app",
                "https://hobby-hub-o8zd.onrender.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationSuccessHandler googleLoginSuccessHandler() {
        return (request, response, authentication) -> {
            OAuth2User oAuth2User = ((OAuth2AuthenticationToken) authentication).getPrincipal();
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String googleId = oAuth2User.getAttribute("sub");
            Boolean emailVerified = oAuth2User.getAttribute("email_verified");

            String redirectBase = getRedirectBase(request);

            if (email == null || !Boolean.TRUE.equals(emailVerified)) {
                response.sendRedirect(redirectBase + "/auth?error=" + URLEncoder.encode("Google email not verified", StandardCharsets.UTF_8));
                return;
            }

            String suggestedUsername = (name != null ? name : email).replaceAll("\\s+", "").toLowerCase();
            Long userId = userRepository.findOrCreateGoogleUser(googleId, email, suggestedUsername);
            String actualUsername = userRepository.findById(userId)
                    .map(u -> u.getUsername())
                    .orElse(suggestedUsername);

            // Start a brand-new session so nothing from a previous login (e.g. an admin) carries over.
            HttpSession oldSession = request.getSession(false);
            if (oldSession != null) {
                oldSession.invalidate();
            }
            HttpSession session = request.getSession(true);
            session.setAttribute("userId", userId);
            session.setAttribute("username", actualUsername);

            String encodedUsername = URLEncoder.encode(actualUsername, StandardCharsets.UTF_8);
            response.sendRedirect(redirectBase + "/feed?user=" + encodedUsername);
        };
    }

    @Bean
    public AuthenticationFailureHandler googleLoginFailureHandler() {
        return (request, response, exception) -> {
            System.err.println("Google OAuth2 Login Failed: " + exception.getMessage());
            String redirectBase = getRedirectBase(request);
            response.sendRedirect(redirectBase + "/auth?error=" +
                    URLEncoder.encode("Google login failed. Please try again or use username/password.", StandardCharsets.UTF_8));
        };
    }

    private String getRedirectBase(HttpServletRequest request) {
        String envFrontend = System.getenv("FRONTEND_URL");
        if (envFrontend != null && !envFrontend.isBlank()) {
            return envFrontend.replaceAll("/+$", "");
        }
        String serverName = request.getServerName();
        String host = request.getHeader("Host");
        String referer = request.getHeader("Referer");
        if ("localhost".equalsIgnoreCase(serverName) || "127.0.0.1".equals(serverName) ||
                (host != null && (host.contains("localhost") || host.contains("127.0.0.1"))) ||
                (referer != null && (referer.contains("localhost") || referer.contains("127.0.0.1")))) {
            return "http://localhost:3000";
        }
        return "https://hobby-hub-nine.vercel.app";
    }
}


