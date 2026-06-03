CREATE TABLE video_comments (

    id BIGINT NOT NULL AUTO_INCREMENT,

    video_id BIGINT,

    user_id BIGINT,

    comment_text VARCHAR(3000) NOT NULL,

    parent_comment_id BIGINT,

    created_at DATETIME,

    PRIMARY KEY (id)

);