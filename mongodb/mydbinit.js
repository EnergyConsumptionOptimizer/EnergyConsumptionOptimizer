var conn = new Mongo();
var db = conn.getDB('user');
db.createCollection('users');

try {
    db.users.insertMany([
        {
            _id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            username: "admin",
            password: "$2a$10$P.ifmqVBktcUtxolB2wcbuY3v25gSdKWeYXoo33rQ4WgWeQ6b/dXW",
            role: "ADMIN",
            createdAt: ISODate("2025-11-25T10:00:00.000Z"),
            updatedAt: ISODate("2025-11-25T10:00:00.000Z")
        },
        {
            _id: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
            username: "usera",
            password: "$2b$10$AiIUkJBN3rBjWzqzJJpBMOnh7uLeC7.3h1W8cztNByLOcxW8k3r/y",
            role: "HOUSEHOLD",
            createdAt: ISODate("2025-11-25T10:00:00.000Z"),
            updatedAt: ISODate("2025-11-25T10:00:00.000Z")
        },
        {
            _id: "94bd0d39-1853-465b-acf3-5b8fa8ed6c76",
            username: "userb",
            password: "$2b$10$qBsHmmCZryqrLADIfdajVeyR5gANjLXfSjkUHfxoAVneLAlBGr7V6",
            role: "HOUSEHOLD",
            createdAt: ISODate("2025-11-25T10:00:00.000Z"),
            updatedAt: ISODate("2025-11-25T10:00:00.000Z")
        }
    ]);
} catch (error) {
    console.log(error);
}
