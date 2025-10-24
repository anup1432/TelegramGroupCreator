import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Logger } from "telegram/extensions/Logger";

// Disable telegram logging
Logger.setLevel("none");

interface TelegramLoginData {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
}

interface TelegramOTPData extends TelegramLoginData {
  phoneCodeHash: string;
  otp: string;
}

// Store active sessions temporarily (in production, use Redis or similar)
const activeSessions = new Map<string, {
  client: TelegramClient;
  phoneCodeHash: string;
}>();

export async function sendTelegramOTP(data: TelegramLoginData): Promise<{ phoneCodeHash: string }> {
  const { apiId, apiHash, phoneNumber } = data;
  
  try {
    const client = new TelegramClient(
      new StringSession(""),
      parseInt(apiId),
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    await client.connect();

    // Send OTP
    const result = await client.sendCode(
      {
        apiId: parseInt(apiId),
        apiHash: apiHash,
      },
      phoneNumber
    );

    const phoneCodeHash = result.phoneCodeHash;

    // Store session temporarily (expires after 5 minutes)
    const sessionKey = `${apiId}-${phoneNumber}`;
    activeSessions.set(sessionKey, { client, phoneCodeHash });

    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      const session = activeSessions.get(sessionKey);
      if (session) {
        session.client.disconnect();
        activeSessions.delete(sessionKey);
      }
    }, 5 * 60 * 1000);

    return { phoneCodeHash };
  } catch (error: any) {
    console.error("Error sending Telegram OTP:", error);
    throw new Error(error.message || "Failed to send OTP");
  }
}

export async function verifyTelegramOTP(data: TelegramOTPData): Promise<{ sessionString: string }> {
  const { apiId, apiHash, phoneNumber, phoneCodeHash, otp } = data;
  const sessionKey = `${apiId}-${phoneNumber}`;

  try {
    const session = activeSessions.get(sessionKey);
    if (!session) {
      throw new Error("Session expired. Please request OTP again.");
    }

    const { client } = session;

    // Verify OTP and sign in
    await client.signInUser(
      {
        apiId: parseInt(apiId),
        apiHash: apiHash,
      },
      {
        phoneNumber,
        phoneCode: async () => otp,
        onError: (err) => {
          console.error("Sign in error:", err);
        },
      }
    );

    // Get session string for future use
    const sessionString = client.session.save() as unknown as string;

    // Clean up
    activeSessions.delete(sessionKey);

    return { sessionString };
  } catch (error: any) {
    console.error("Error verifying Telegram OTP:", error);
    
    // Clean up on error
    const session = activeSessions.get(sessionKey);
    if (session) {
      session.client.disconnect();
      activeSessions.delete(sessionKey);
    }

    throw new Error(error.message || "Failed to verify OTP");
  }
}

export async function createTelegramGroupsWithSession(
  apiId: string,
  apiHash: string,
  sessionString: string,
  groupNames: string[],
  isPrivate: boolean = false
): Promise<Array<{ name: string; telegramGroupId: string; inviteLink: string }>> {
  try {
    const client = new TelegramClient(
      new StringSession(sessionString),
      parseInt(apiId),
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    await client.connect();

    const groups: Array<{ name: string; telegramGroupId: string; inviteLink: string }> = [];

    for (const groupName of groupNames) {
      try {
        // Create group/channel
        const result = await client.invoke(
          new (await import("telegram/tl")).Api.channels.CreateChannel({
            title: groupName,
            about: "",
            megagroup: !isPrivate, // true for groups, false for channels
          })
        );

        // Get the created channel/group
        const updates = result as any;
        const channelId = updates.chats?.[0]?.id?.toString() || "";
        const channel = updates.chats?.[0];
        
        // Export invite link
        const inviteResult = await client.invoke(
          new (await import("telegram/tl")).Api.messages.ExportChatInvite({
            peer: channel,
          })
        );

        const inviteLink = (inviteResult as any).link || "";

        groups.push({
          name: groupName,
          telegramGroupId: channelId,
          inviteLink,
        });

        // Small delay between group creations to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error creating group ${groupName}:`, error);
        // Continue with next group
      }
    }

    await client.disconnect();
    return groups;
  } catch (error: any) {
    console.error("Error creating Telegram groups:", error);
    throw new Error(error.message || "Failed to create groups");
  }
}

export async function sendAutoMessages(
  apiId: string,
  apiHash: string,
  sessionString: string,
  groupId: string,
  messages: string[]
): Promise<void> {
  try {
    const client = new TelegramClient(
      new StringSession(sessionString),
      parseInt(apiId),
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    await client.connect();

    for (const message of messages) {
      try {
        await client.sendMessage(groupId, { message });
        // Small delay between messages
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error sending message to group ${groupId}:`, error);
      }
    }

    await client.disconnect();
  } catch (error: any) {
    console.error("Error sending auto messages:", error);
    throw new Error(error.message || "Failed to send messages");
  }
}
