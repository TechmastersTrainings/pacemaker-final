CREATE TABLE subscriptions (

    id BIGINT NOT NULL AUTO_INCREMENT,

    user_id BIGINT,

    plan_name VARCHAR(255) NOT NULL,

    subscription_status VARCHAR(255) NOT NULL,

    start_date DATETIME,

    expiry_date DATETIME,

    PRIMARY KEY (id)

);

CREATE TABLE payment_webhooks (

    id BIGINT NOT NULL AUTO_INCREMENT,

    payment_id VARCHAR(255),

    user_id BIGINT,

    event_type VARCHAR(255),

    payment_status VARCHAR(255),

    amount DOUBLE,

    received_at DATETIME,

    PRIMARY KEY (id)

);