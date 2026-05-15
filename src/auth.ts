import NextAuth, { type DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      discordId?: string | null;
    } & DefaultSession["user"];
  }
}

const ALLOWED_ROLE_IDS = (process.env.DISCORD_ALLOWED_ROLE_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function fetchDiscordRoles(
  guildId: string,
  accessToken: string
): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://discord.com/api/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { roles?: string[] };
    return data.roles ?? [];
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: { scope: "identify email guilds guilds.members.read" },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider !== "discord") return false;

      const discordId = (profile as any)?.id ?? account.providerAccountId;
      const bootstrap = process.env.BOOTSTRAP_ADMIN_DISCORD_ID;
      if (bootstrap && bootstrap === discordId) return true;

      if (ALLOWED_ROLE_IDS.length === 0) return true;

      const guildId = process.env.DISCORD_GUILD_ID;
      const token = account.access_token;
      if (!guildId || !token) return "/login?error=NoGuildConfig" as any;

      const roles = await fetchDiscordRoles(guildId, token);
      if (!roles) return "/login?error=NotInGuild" as any;

      const ok = roles.some((r) => ALLOWED_ROLE_IDS.includes(r));
      return ok ? true : ("/login?error=NoAccess" as any);
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, discordId: true },
      });
      if (session.user) {
        session.user.id = user.id;
        session.user.role = dbUser?.role ?? "VISITOR";
        session.user.discordId = dbUser?.discordId ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "discord" || !user.id) return;
      const discordId = account.providerAccountId;
      const bootstrap = process.env.BOOTSTRAP_ADMIN_DISCORD_ID;
      const data: { discordId: string; role?: Role } = { discordId };
      if (bootstrap && bootstrap === discordId) {
        data.role = "ADMIN";
      } else {
        // Promotion automatique au rôle EMPLOYEE si encore VISITOR
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (!existing || existing.role === "VISITOR") {
          data.role = "EMPLOYEE";
        }
      }
      await prisma.user.update({ where: { id: user.id }, data });
    },
  },
  pages: { signIn: "/login" },
});
