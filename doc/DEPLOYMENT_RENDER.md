# 🚀 Deploying Nexo Credential Network on Render

This guide provides step-by-step instructions for deploying the **Nexo Credential Network** on [Render](https://render.com).

---

## Architecture on Render

* **Framework:** Next.js 14 (Node.js runtime `v20.18.0`)
* **Service Type:** Web Service (Free tier or Starter)
* **Database:** SQLite (`prisma/dev.db`) pre-migrated via `prisma db push` (or cloud PostgreSQL)
* **Configuration:** Managed via `render.yaml` (Infrastructure-as-Code Blueprint)

---

## Method 1: Automatic 1-Click Deployment (Render Blueprint) — Recommended

Because `render.yaml` is now in your repository, Render can automatically configure the build commands, environment variables, health checks, and start scripts in one click.

### Step-by-Step:
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. In the top-right corner, click **New +** $\rightarrow$ select **Blueprint**.
3. Connect your GitHub account and select the **`Nexo`** repository.
4. Render will automatically detect the **`render.yaml`** file:
   * **Service Name:** `nexo-credential-network`
   * **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
   * **Start Command:** `npm run start`
   * **Auto-generated Secret:** `SESSION_SECRET`
5. Click **Apply**.
6. Render will automatically build the Next.js app, initialize the database tables, and deploy it to a live public URL:
   👉 `https://nexo-credential-network.onrender.com`

---

## Method 2: Manual Web Service Setup (Without Blueprint)

If you prefer creating a Web Service manually from the Render dashboard:

1. Click **New +** $\rightarrow$ **Web Service**.
2. Select your repository: `ajit-builds/Nexo`.
3. Configure the following settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `nexo-credential-network` |
| **Region** | `Oregon (US West)` or `Frankfurt (EU)` |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npx prisma db push && npm run build` |
| **Start Command** | `npm run start` |
| **Plan Type** | `Free` |

4. Scroll down to **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20.18.0` |
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `NEXT_PUBLIC_POLYGON_AMOY_RPC` | `https://rpc-amoy.polygon.technology` |
| `NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS` | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| `NEXT_PUBLIC_REVOCATION_REGISTRY_ADDRESS`| `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| `NEXT_PUBLIC_IPFS_GATEWAY` | `https://gateway.pinata.cloud/ipfs/` |
| `SESSION_SECRET` | *(click 'Generate' for a random 32-character key)* |

5. Click **Create Web Service**.

---

## Post-Deployment Verification

Once Render finishes deploying:
1. Open the public URL provided by Render (e.g., `https://nexo-credential-network.onrender.com`).
2. Test the **University Portal** (`/login` $\rightarrow$ `admin@university.edu.in` / `Password@123`).
3. Test the **Student Wallet** (`/login` $\rightarrow$ `student@college.isu.ac.in` / `Password@123`).
4. Test the **Recruiter Verifier** (`/verify`).

---

## Important Render Free-Tier Notes

* **Spindown after Inactivity:** On Render's Free tier, the web service automatically spins down (goes to sleep) after 15 minutes of inactivity. When a new visitor opens the URL, Render wakes the server up in about **30 to 50 seconds**. Subsequent requests are instantaneous.
* **Persistent Database Option:** If you want database records to persist permanently across service rebuilds, you can create a free **Render PostgreSQL** database under *New + $\rightarrow$ PostgreSQL* and update `DATABASE_URL` with the external connection string.
