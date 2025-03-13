# Gym Class Booking Automation

This repository contains an automated script to book gym classes using Playwright. The script logs into the gym's online portal, finds the scheduled class, and attempts to book it. If the class is full, it will notify you via Slack and retry later if necessary.

## 🚀 Features
- **Automated Gym Booking**: Automatically books your specified classes.
- **Waitinglist Handling**: Detects when you're placed on the waitlist.
- **Slack Notifications**: Sends alerts when bookings succeed, fail, or when you're added to the waitinglist.
- **GitHub Actions Support**: Runs daily at 6:55 am via GitHub Actions.
- **Error Handling**: Captures unexpected issues and alerts via Slack.

## 📌 Prerequisites
### Install Dependencies
1. **Install Node.js** (Recommended version: 18 or higher)
2. **Clone this repository**
   ```sh
   git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```
3. **Install dependencies**
   ```sh
   npm install
   ```
4. **Install Playwright browsers**
   ```sh
   npx playwright install --with-deps
   ```

## 🔧 Configuration
### 1️⃣ **Set Up Environment Variables**
Create a `.env.local` file in the project root with the following:
```ini
GYM_URL=https://your-gym-booking-url.com
GYM_EMAIL=your_email@example.com
GYM_PASSWORD=your_password
CLASS_SCHEDULE={"2": "Pilates 11:30 1","4":"Pilates 10:30 2","5":"Body Pump 10:30 2","6":"Pilates 9:00 1","0":"Body Pump 11:30 1"}
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```
- Replace `GYM_URL`, `GYM_EMAIL`, and `GYM_PASSWORD` with your gym login details.
- Modify `CLASS_SCHEDULE` to match your preferred schedule.
- Add your **Slack Webhook URL** to receive notifications.

### 2️⃣ **Run the Script Manually**
You can test the script locally before automating it:
```sh
npx tsx gymBooking.ts
```

## 🤖 Automate with GitHub Actions
### 1️⃣ **Store Secrets in GitHub**
Since `.env.local` isn't committed to Git, store sensitive values in **GitHub Secrets**:
1. Go to **GitHub Repository → Settings → Secrets and Variables → Actions**.
2. Add the following secrets:
   - `GYM_URL`
   - `GYM_EMAIL`
   - `GYM_PASSWORD`
   - `CLASS_SCHEDULE`
   - `SLACK_WEBHOOK_URL`

### 2️⃣ **Enable GitHub Actions**
The script runs automatically at `6:55 AM UTC` daily. To enable:
1. Create `.github/workflows/gym_booking.yml`.
2. Add the following workflow:
```yaml
name: Gym Class Booking Automation

on:
  schedule:
    - cron: '55 6 * * *'  # Runs daily at 6:55 AM UTC
  workflow_dispatch:      # Allows manual triggering

jobs:
  book-class:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Gym Booking Script
        env:
          GYM_URL: ${{ secrets.GYM_URL }}
          GYM_EMAIL: ${{ secrets.GYM_EMAIL }}
          GYM_PASSWORD: ${{ secrets.GYM_PASSWORD }}
          CLASS_SCHEDULE: ${{ secrets.CLASS_SCHEDULE }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: npx tsx gymBooking.ts
```

### 3️⃣ **Commit and Push Changes**
```sh
git add .
git commit -m "Added GitHub Actions for gym booking"
git push origin main
```

### 4️⃣ **Verify the Automation**
- Go to **GitHub Actions** → **Gym Booking Automation**.
- Click **Run Workflow** to manually test it.
- Monitor logs to ensure successful execution.

## 🛠️ Debugging & Logs
### **View GitHub Actions Logs**
- If the script fails, go to **GitHub → Actions → Gym Booking Automation** and inspect logs.

### **Run Locally with Debugging**
```sh
npx tsx gymBooking.ts --debug
```

## ✨ Future Enhancements
- **Auto-cancel existing bookings** if needed.
- **Monitor available spots in real-time** and book instantly when a spot opens.

## 📜 License
This project is **open-source** and available under the [MIT License](LICENSE).

