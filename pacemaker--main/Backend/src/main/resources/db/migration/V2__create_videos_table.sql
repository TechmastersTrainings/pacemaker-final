CREATE TABLE videos (

    id BIGINT NOT NULL AUTO_INCREMENT,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    tags VARCHAR(255),

    subject VARCHAR(255),

    asset_id VARCHAR(255),

    upload_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id)

);