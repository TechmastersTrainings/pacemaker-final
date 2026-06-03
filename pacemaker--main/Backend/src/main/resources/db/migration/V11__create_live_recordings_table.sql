CREATE TABLE live_recordings (

    id BIGINT NOT NULL AUTO_INCREMENT,

    live_class_id BIGINT,

    zoom_recording_url VARCHAR(1000),

    mux_asset_id VARCHAR(255),

    mux_playback_url VARCHAR(1000),

    uploaded_at DATETIME,

    PRIMARY KEY (id)

);