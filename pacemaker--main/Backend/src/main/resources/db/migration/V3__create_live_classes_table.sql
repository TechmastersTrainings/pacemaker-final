CREATE TABLE live_classes (

    id BIGINT NOT NULL AUTO_INCREMENT,

    title VARCHAR(255) NOT NULL,

    class_date_time DATETIME NOT NULL,

    zoom_join_url VARCHAR(1000) NOT NULL,

    zoom_meeting_id VARCHAR(255),

    PRIMARY KEY (id)

);