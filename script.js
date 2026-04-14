let tickerInterval; 

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', saveData);
    document.getElementById('edit-btn').addEventListener('click', editData);
    document.getElementById('reset-btn').addEventListener('click', resetData);

    const savedData = localStorage.getItem('cozyWorkData');
    if (savedData) {
        startDashboard();
    }
});

function saveData() {
    const name = document.getElementById('name').value;
    const company = document.getElementById('company').value;
    const startDate = document.getElementById('startDate').value;
    const salary = document.getElementById('salary').value;
    const hours = document.getElementById('hours').value;
    const startTime = document.getElementById('startTime').value;

    if (!name || !company || !startDate || !salary || !hours || !startTime) {
        alert("Please fill in all your passport details!");
        return;
    }

    const data = { 
        name, 
        company, 
        startDate, 
        salary: parseFloat(salary),
        hours: parseFloat(hours),
        startTime: startTime
    };
    
    localStorage.setItem('cozyWorkData', JSON.stringify(data));
    startDashboard();
}

function editData() {
    const rawData = localStorage.getItem('cozyWorkData');
    if (!rawData) return;
    const data = JSON.parse(rawData);

    document.getElementById('name').value = data.name;
    document.getElementById('company').value = data.company;
    document.getElementById('startDate').value = data.startDate;
    document.getElementById('salary').value = data.salary;
    document.getElementById('hours').value = data.hours || 8;
    document.getElementById('startTime').value = data.startTime || "09:00";

    document.getElementById('setup-subtitle').innerText = "Update your passport details!";
    document.getElementById('start-btn').innerText = "Save Changes!";

    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
    
    clearInterval(tickerInterval);
}

function resetData() {
    if(confirm("Are you sure you want to delete your save data?")) {
        localStorage.removeItem('cozyWorkData');
        location.reload(); 
    }
}

function startDashboard() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    
    updateStats();
    clearInterval(tickerInterval);
    tickerInterval = setInterval(updateStats, 1000); 
}

// Helper function to format time (e.g. 09:00 to 9:00 AM)
function formatAMPM(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateStats() {
    const rawData = localStorage.getItem('cozyWorkData');
    if (!rawData) return;
    
    const data = JSON.parse(rawData);
    const now = new Date();
    const start = new Date(data.startDate);

    document.getElementById('greeting').innerText = `Welcome, ${data.name}! 👋`;
    document.getElementById('display-company').innerText = data.company;

    /* BASE RATES MATH */
    const yearlySalary = data.salary * 12;
    const weeklySalary = yearlySalary / 52;
    const dailyRate = weeklySalary / 5; 
    const hourlyRate = dailyRate / data.hours; 

    document.getElementById('daily-rate').innerText = `$${dailyRate.toFixed(2)}`;
    document.getElementById('hourly-rate').innerText = `$${hourlyRate.toFixed(2)}`;

    /* DAILY TRACKER MATH (NEW) */
    // Figure out shift start and end times for TODAY
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const shiftStartToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute, 0);
    
    // Total shift duration includes the user's work hours PLUS 1 hour for lunch
    const shiftDurationHours = data.hours + 1; 
    const shiftDurationMs = shiftDurationHours * 60 * 60 * 1000;
    const shiftEndToday = new Date(shiftStartToday.getTime() + shiftDurationMs);

    // Display shift times
    document.getElementById('shift-hours').innerText = `${formatAMPM(shiftStartToday)} - ${formatAMPM(shiftEndToday)}`;

    // How much time has passed since the shift started?
    let elapsedShiftMs = now.getTime() - shiftStartToday.getTime();
    
    // Constrain it: Don't go below 0 (before work) and don't go above total shift time (after work)
    elapsedShiftMs = Math.max(0, Math.min(elapsedShiftMs, shiftDurationMs));

    // Calculate Daily Progress % and Earnings
    const dailyPercentage = (elapsedShiftMs / shiftDurationMs) * 100;
    // Earnings scale evenly over the total shift time (lunch included, so it constantly ticks up)
    const earnedToday = dailyRate * (elapsedShiftMs / shiftDurationMs);

    document.getElementById('daily-progress-bar').style.width = `${dailyPercentage}%`;
    document.getElementById('daily-earned').innerText = `$${earnedToday.toFixed(2)} / $${dailyRate.toFixed(2)}`;
    
    // Change color to green if shift is fully complete!
    if (dailyPercentage >= 100) {
        document.getElementById('daily-earned').style.color = "var(--primary)";
        document.getElementById('daily-progress-bar').style.backgroundColor = "var(--primary)";
    } else {
        document.getElementById('daily-earned').style.color = "var(--daily-accent)";
        document.getElementById('daily-progress-bar').style.backgroundColor = "var(--daily-accent)";
    }

    /* TOTAL TIME & MONTHLY MATH */
    const totalMs = now - start;
    if (totalMs < 0) {
        document.getElementById('total-earned').innerText = "$0.00";
        document.getElementById('month-earned').innerText = `$0.00 / $${data.salary.toFixed(2)}`;
        return;
    }

    const msPerMonth = 30.44 * 24 * 60 * 60 * 1000; 
    const salaryPerMs = data.salary / msPerMonth;
    const totalEarned = totalMs * salaryPerMs;
    document.getElementById('total-earned').innerText = `$${totalEarned.toFixed(2)}`;

    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();
    const monthPercentage = (currentDayOfMonth / daysInCurrentMonth) * 100;
    const earnedThisMonth = (data.salary * (currentDayOfMonth / daysInCurrentMonth));

    document.getElementById('progress-bar').style.width = `${Math.min(monthPercentage, 100)}%`;
    document.getElementById('month-earned').innerText = `$${earnedThisMonth.toFixed(2)} / $${data.salary.toFixed(2)}`;
}
