import { storage } from "./storage";

export async function seedAdminUser() {
  try {
    const adminUsername = "admin";
    const adminPassword = "admin123";
    
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      console.log("Creating admin user...");
      const adminUser = await storage.createUser(
        adminUsername,
        adminPassword,
        "admin@example.com",
        "Admin",
        "User"
      );
      
      await (storage as any).setUserAsAdmin(adminUser.id);
      
      console.log("Admin user created successfully (username: admin, password: admin123)");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
