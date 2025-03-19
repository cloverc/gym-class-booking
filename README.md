# Gym Class Booking Automation 🏋🏻‍♀️

An automated script to book gym classes using Playwright. 
The script logs into the gym's online portal, finds the scheduled class and attempts to book it. If the class is full, it sends a Slack notification.

## 🚀 Features
- **Automated Gym Booking**: Automatically books your specified classes.
- **Waitinglist Handling**: Detects when you're placed on the waitlist.
- **Slack Notifications**: Sends alerts when bookings succeed, fail, or when you're added to the waitinglist.
- **GitHub Actions Support**: Runs daily at 6:30 am via GitHub Actions.
- **Error Handling**: Captures unexpected issues and alerts via Slack.

## 📌 Prerequisites
### Install Dependencies
1. **Install Node.js** (Recommended version: 18 or higher)
4. **Install Playwright browsers**
   ```sh
   npx playwright install --with-deps
   ```

## 🔧 Configuration
### 1️⃣ **Set Up Environment Variables**
Create a `.env` file in the project root with the following:
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

Since `.env` isn't committed to Git, sensitive values can be stored in **GitHub Secrets**:
1. Go to **GitHub Repository → Settings → Secrets and Variables → Actions**.
2. Add the following secrets:
   - `GYM_URL`
   - `GYM_EMAIL`
   - `GYM_PASSWORD`
   - `CLASS_SCHEDULE`
   - `SLACK_WEBHOOK_URL`

The script runs automatically at `6:30 AM UTC` daily.

## 🛠️ Debugging & Logs
### **View GitHub Actions Logs**
- If the script fails, go to **GitHub → Actions → Gym Booking Automation** and inspect logs.

### **Run Locally with Debugging**
```sh
npx tsx gymBooking.ts --debug
```

