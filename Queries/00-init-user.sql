-- Create the walktogether_user role if it doesn't exist
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'walktogether_user') THEN
        CREATE ROLE walktogether_user WITH LOGIN PASSWORD 'walktogether_password';
    END IF;
END
$$;

-- Create the walktogether database if it doesn't exist
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'walktogether') THEN
        CREATE DATABASE walktogether OWNER walktogether_user;
    END IF;
END
$$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE walktogether TO walktogether_user;