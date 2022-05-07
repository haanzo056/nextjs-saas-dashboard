import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { db } from './db';
import { env, githubEnabled } from './env';
import { signInSchema } from './validators';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  // Credentials provider only works with JWT sessions, see docs/adr/0002.
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    ...(githubEnabled
      ? [GitHubProvider({ clientId: env.GITHUB_ID!, clientSecret: env.GITHUB_SECRET! })]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id ?? token.sub!;
      return session;
    },
  },
};
