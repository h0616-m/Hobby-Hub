CREATE TABLE User
    (
      U_Name varchar(20) NOT NULL,
      Email_id varchar(30) NOT NULL,
      Password varchar(10) NOT NULL,
      Username varchar(20) PRIMARY KEY
     );
CREATE TABLE Post
     (
      Likes int DEFAULT 0,
      Context text NOT NULL,
      Post_id int PRIMARY KEY
     );
CREATE TABLE Event
     (
      Event_id int PRIMARY KEY,
      E_name varchar(20) NOT NULL,
      Organised_By varchar(20) NOT NULL,
      No_of_registration INT DEFAULT 0
     );
CREATE TABLE Online
     (
      Paltform varchar(20) NOT NULL,
      O_Event_id int ,
      FOREIGN KEY (O_Event_id) REFERENCES Event(Event_id)
     );
CREATE TABLE Offline
     (
      Location varchar(50) NOT NULL,
      Of_Event_id int,
      FOREIGN KEY (Of_Event_id) REFERENCES Event(Event_id)
     );
CREATE TABLE Action
     (
      U_Name varchar(20) NOT NULL,
      Email_id varchar(30) NOT NULL,
      Password varchar(10) NOT NULL,
      Username varchar(20) ,
      Likes int DEFAULT 0,
      Context text NOT NULL,
      Post_id int,
      FOREIGN KEY(Username) REFERENCES User(Username),
      FOREIGN KEY(Post_id) REFERENCES Post(Post_id)
     );
CREATE TABLE Enrollment
     (
      U_Name varchar(20) NOT NULL,
      Email_id varchar(30) NOT NULL,
      Password varchar(10) NOT NULL,
      Username varchar(20) ,
      Event_id int,
      E_name varchar(20) NOT NULL,
      Organised_By varchar(20) NOT NULL,
      No_of_registration int DEFAULT 0,
     FOREIGN KEY (Username) REFERENCES User(Username),
     FOREIGN KEY (Event_id) REFERENCES Event(Event_id)
     );
CREATE TABLE Hobby
     (
      N_Hobby varchar(10),
      Username varchar(20),
      FOREIGN KEY(Username) REFERENCES User(Username)
     );
CREATE TABLE Communities_Joined
     (
      N_Communities_Joined varchar(20),
      Username varchar(20),
      FOREIGN KEY(Username) REFERENCES User(Username)
     );
CREATE TABLE Images
     (
      N_Images BLOB NOT NULL,
      Post_id int ,
      FOREIGN KEY(Post_id) REFERENCES Post(Post_id)
     );
CREATE TABLE Comments
     (
      N_Comments varchar(200) NOT NULL,
      Post_id int ,
      FOREIGN KEY(Post_id) REFERENCES Post(Post_id)
     );
CREATE TABLE Sponsers
     (
      N_Sponsers varchar(20),
      Event_id int,
      FOREIGN KEY(Event_id) REFERENCES Event(Event_id)
     );
CREATE TABLE Chat_Com
     (
      Chat_Type varchar(20) NOT NULL,
      Chat_Name varchar(20) NOT NULL,
      Chatroom_id int ,
      Chat_No_of_users int DEFAULT 0,
      Com_Name varchar(20) NOT NULL,
      Com_Type varchar(20) NOT NULL,
      Community_id int,
      Com_No_of_users int DEFAULT 0,
      PRIMARY KEY(Chatroom_id,Community_id)
     );
CREATE TABLE Ineteraction
    (
      U_Name varchar(20) NOT NULL,
      Email_id varchar(30) NOT NULL,
    
      Password varchar(10) NOT NULL,
      Username varchar(20) ,
      Chat_Name varchar(20) NOT NULL,
      Chat_Type varchar(20) NOT NULL,
      Chatroom_id int,
      Chat_No_of_users int DEFAULT 0,
      FOREIGN KEY(Username) REFERENCES User(Username),
      FOREIGN KEY(Chatroom_id) REFERENCES Chat_Com(Chatroom_id)
     );
CREATE TABLE Engagement
     (
      U_Name varchar(20) NOT NULL,
      Email_id varchar(30) NOT NULL,
      Password varchar(10) NOT NULL,
      Username varchar(20) ,
      Com_Name varchar(20) NOT NULL,
      Com_Type varchar(20) NOT NULL,
      Community_id int,
      Com_No_of_users int DEFAULT 0,
      FOREIGN KEY(Username) REFERENCES User(Username)
     );
ALTER TABLE Engagement
     ADD CONSTRAINT FK_EngagementChat_Com
     FOREIGN KEY (Community_id) REFERENCES Chat_Com (Community_id);