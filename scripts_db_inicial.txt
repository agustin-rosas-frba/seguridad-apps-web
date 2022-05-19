create database seguridad_apps_web;
use seguridad_apps_web;

CREATE TABLE users (
    user varchar(20),
    name varchar(100),
    rol varchar(50),
    hashed_pwd varchar(255)
);

CREATE TABLE queries (
    assigned_user varchar(20),
    query varchar(255)
);




ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;
