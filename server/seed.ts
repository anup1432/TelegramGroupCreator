import { storage } from "./storage";
import { User } from "@shared/schema";

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
      
      await User.findByIdAndUpdate(adminUser._id, { isAdmin: true });
      
      console.log("Admin user created successfully (username: admin, password: admin123)");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
