import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const GYM_URL = process.env.GYM_URL!;
const GYM_EMAIL = process.env.GYM_EMAIL!;
const GYM_PASSWORD = process.env.GYM_PASSWORD!;
const CLASS_SCHEDULE = JSON.parse(process.env.CLASS_SCHEDULE!);
const MAX_RETRIES = 3;

async function sendSlackNotification(message: string) {
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
    if (!SLACK_WEBHOOK_URL) {
        console.error("⚠️ No Slack Webhook URL found. Cannot send notification.");
        return;
    }

    try {
        await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message })
        });
        console.log("📩 Slack notification sent!");
    } catch (error) {
        console.error(`❌ Failed to send Slack notification: ${error}`);
    }
}

function getBookingDetails(): { className: string | null; time: string | null; date: string; classIndex: number } {
    const today = new Date();

    today.setDate(today.getDate() + 9);
    const bookingDay = today.getDay().toString();

    if (CLASS_SCHEDULE[bookingDay]) {
        const classInfo = CLASS_SCHEDULE[bookingDay].split(" ");
        const lastSpaceIndex = classInfo.length - 2;
        const className = classInfo.slice(0, lastSpaceIndex).join(" ").trim();
        const time = classInfo[lastSpaceIndex].trim();
        const classIndex = parseInt(classInfo[classInfo.length - 1]);

        return { className, time, date: today.toISOString().split('T')[0], classIndex };
    } else {
        return { className: null, time: null, date: today.toISOString().split('T')[0], classIndex: 1 };
    }
}

// Helper function to format date
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(date).replace(',', '');
}

async function bookGymClass(): Promise<void> {
    const { className, time, date, classIndex } = getBookingDetails();

    if (!className || !time) {
        console.log(`🚫 No class scheduled for ${formatDate(date)}. Skipping.`);
        return;
    }

    console.log(`🔍 Attempting to book occurrence #${classIndex} of "${className}" at ${time} on ${formatDate(date)}`);

    const browser = await chromium.launch();
    const context = await browser.newContext({ bypassCSP: true, ignoreHTTPSErrors: true });
    await context.clearCookies();
    await context.clearPermissions();
    const page = await context.newPage();

    try {
        console.log(`🔐 Logging in...`);
        await page.goto(GYM_URL);
        await page.waitForSelector('button:has-text("Log in")');
        await page.locator('button:has-text("Log in")').click();

        await page.waitForSelector('input[id="login_step_login_username"]');
        await page.fill('input[id="login_step_login_username"]', GYM_EMAIL);
        await page.locator('#login_step_login_submit').click();

        await page.waitForSelector('input[name="_password"]');
        await page.fill('input[name="_password"]', GYM_PASSWORD);
        await page.locator('#submit').click();
        await page.waitForLoadState('networkidle');

        console.log(`✅ Login successful!`);

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`⏳ Attempt ${attempt}/${MAX_RETRIES}...`);
                await page.goto(GYM_URL, { waitUntil: 'networkidle', timeout: 60000 });
                await page.reload({ waitUntil: 'networkidle', timeout: 60000 });

                let dateFound = await page.locator(`button[value="${date}"]`).isVisible();
                const nextDateButton = page.locator('button[value="1"]');

                while (!dateFound) {
                    console.log(`📅 Date ${date} not visible. Clicking "Next Date Range"...`);
                    if (await nextDateButton.isVisible()) {
                        await nextDateButton.click();
                        await page.waitForTimeout(2000);
                    } else {
                        console.error(`❌ Could not find "Next Date Range" button.`);
                        continue;
                    }
                    await page.waitForTimeout(1000);
                    dateFound = await page.locator(`button[value="${date}"]`).isVisible();
                }

                await page.locator(`button[value="${date}"]`).click();
                await page.waitForLoadState('networkidle');

                const classCard = page.locator(`h3[title*="${className}"]`).nth(classIndex - 1);

                if (!(await classCard.isVisible())) {
                    console.error(`❌ No occurrence #${classIndex} of "${className}" found for ${date}.`);
                    return;
                }

                console.log(`✅ Occurrence #${classIndex} of "${className}" at ${time} found! Clicking to open booking dialog...`);
                await classCard.click();
                await page.waitForTimeout(1000);

                const dialog = await page.locator('div[role="dialog"]');
                await dialog.waitFor({ state: 'visible', timeout: 5000 });

                // ✅ Close and reopen dialog to refresh status
                await page.keyboard.press('Escape'); // Close the dialog
                await page.waitForTimeout(1000); // Allow UI to update
                await classCard.click(); // Reopen dialog
                await page.waitForTimeout(2000); // Ensure dialog is fully loaded

                // ✅ Locate the first "Cancel" button inside the dialog
                const cancelButton = dialog.locator('button:has-text("Cancel")').first();

                if (await cancelButton.isVisible()) {
                  console.log(`✅ Confirmed: This "Cancel" button belongs to "${className}" at ${time}.`);
                  console.log(`🚫 No need to book.`);
                  return;
                } else {
                  console.log(`❌ No valid "Cancel" button found. Proceeding with booking.`);
                }

                const bookButton = dialog.locator('button:has-text("Book")');
                if (await bookButton.isVisible()) {
                    await bookButton.click();
                    console.log(`📅 Clicked "Book" button for occurrence #${classIndex} of "${className}" at ${time}!`);
                } else {
                    console.warn(`⚠️ "Book" button not found. The class may be full.`);
                }

                console.log("⏳ Waiting for booking confirmation...");
                try {
                    const bookingResponse = await page.waitForResponse(
                        response => response.url().includes("api.uk.resamania.com/brooklands/attendees") && (response.status() === 200 || response.status() === 201),
                        { timeout: 60000 }
                    );

                    const bookingData = await bookingResponse.json();
                    console.log(`📡 Booking API Response:`, bookingData);

                    if (bookingData.state === "booked") {
                        console.log(`🎉 Successfully booked "${className}" at ${time} on ${formatDate(date)}!`);
                        await sendSlackNotification(`🎉 Successfully booked "${className}" at ${time} on ${formatDate(date)}!`)
                        return;
                    } else if (bookingData.state === "queued") {
                        console.warn(`⚠️ Class is full, but you've been added to the waitlist.`);
      
                        await sendSlackNotification(`⚠️ Gym booking waitlisted! Your class (${className} at ${time} on ${formatDate(date)}) is full, but you're on the waiting list.`);
        
                        return;
                    } else if (bookingData.state === "canceled") {
                        console.warn(`❌ Booking was canceled`);
                    } else {
                        console.error(`❌ Unexpected booking state: ${bookingData.state}`);
                    }
                } catch (apiError) {
                    console.error(`❌ Booking confirmation timeout. Checking UI instead...`);

                    try {
                        await page.waitForSelector('text=Booking confirmed', { timeout: 60000 });
                        console.log("🎉 Booking CONFIRMED via UI message!");
                        return;
                    } catch (uiError) {
                        console.error("❌ Booking failed: No confirmation message found.");
                    }
                }
            } catch (error) {
                console.error(`❌ Booking attempt ${attempt} failed: ${error}`);
            }
        }
    } catch (error) {
        console.error(`❌ Login failed: ${error}`);
        await sendSlackNotification(`❌ ERROR: ${error}`);
    } finally {
        await browser.close();
    }
}

bookGymClass();
