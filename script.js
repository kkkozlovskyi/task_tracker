var entries = [];

function calculateDuration(from, to) {
    var fromParts = from.split(':');
    var toParts = to.split(':');
    var fromHour = parseInt(fromParts[0]);
    var fromMin = parseInt(fromParts[1]);
    var toHour = parseInt(toParts[0]);
    var toMin = parseInt(toParts[1]);
    
    var fromMinutes = fromHour * 60 + fromMin;
    var toMinutes = toHour * 60 + toMin;
    
    var diffMinutes = toMinutes - fromMinutes;
    
    if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
    }
    
    return (diffMinutes / 60).toFixed(2);
}

function addEntry() {
    var fromTime = document.getElementById('fromTime').value;
    var toTime = document.getElementById('toTime').value;
    var project = document.getElementById('project').value;
    var taskDetails = document.getElementById('taskDetails').value;
    var entryType = document.querySelector('input[name="entryType"]:checked').value;

    if (!fromTime || !toTime || !project) {
        alert('Please fill in From, To, and Project fields');
        return;
    }

    var duration = parseFloat(calculateDuration(fromTime, toTime));
    
    var entry = {
        id: Date.now(),
        from: fromTime,
        to: toTime,
        project: project.toLowerCase().trim(), // Normalize project name to lowercase
        taskDetails: taskDetails,
        duration: duration,
        originalProject: project.trim(), // Store original for display
        type: entryType // Store entry type (external/internal)
    };

    entries.push(entry);
    
    document.getElementById('fromTime').value = '';
    document.getElementById('toTime').value = '';
    document.getElementById('project').value = '';
    document.getElementById('taskDetails').value = '';
    document.getElementById('external').checked = true; // Reset to external

    renderEntries();
    renderSummary();
}

function deleteEntry(id) {
    entries = entries.filter(function(entry) {
        return entry.id !== id;
    });
    renderEntries();
    renderSummary();
}

function deleteAll() {
    if (entries.length > 0 && confirm('Are you sure you want to delete all entries?')) {
        entries = [];
        renderEntries();
        renderSummary();
    }
}

function renderEntries() {
    var entriesList = document.getElementById('entriesList');
    var totalSection = document.getElementById('totalSection');
    var totalHours = document.getElementById('totalHours');

    if (entries.length === 0) {
        entriesList.innerHTML = '<p class="text-muted text-center py-4">No entries yet</p>';
        totalSection.classList.add('d-none');
        return;
    }

    var total = 0;
    var html = '<div class="list-group list-group-flush">';
    
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        total += entry.duration;
        var taskDetailsHtml = '';
        if (entry.taskDetails) {
            taskDetailsHtml = '<small class="text-muted">' + entry.taskDetails + '</small>';
        }
        
        html += '<div class="list-group-item px-0">';
        html += '<div class="d-flex justify-content-between align-items-start">';
        html += '<div class="flex-grow-1">';
                html += '<div class="d-flex align-items-center mb-1">';
                html += '<strong class="me-2">' + (entry.originalProject || entry.project) + '</strong>';
                html += '<span class="badge ' + (entry.type === 'external' ? 'bg-primary' : 'bg-secondary') + ' me-2">' + entry.type.charAt(0).toUpperCase() + entry.type.slice(1) + '</span>';
                html += '<small class="text-muted">' + entry.from + ' - ' + entry.to + '</small>';
                html += '</div>';
        html += taskDetailsHtml;
        html += '</div>';
        html += '<div class="d-flex align-items-center gap-2">';
        html += '<span class="duration-badge">' + entry.duration + ' h</span>';
        html += '<button onclick="deleteEntry(' + entry.id + ')" class="btn btn-sm btn-outline-danger btn-delete">Delete</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }
    
    html += '</div>';
    entriesList.innerHTML = html;
    totalHours.textContent = total.toFixed(2) + ' h';
    totalSection.classList.remove('d-none');
}

function renderSummary() {
    var summaryTable = document.getElementById('summaryTable');

    if (entries.length === 0) {
        summaryTable.innerHTML = '<p class="text-muted text-center py-4">No data to summarize</p>';
        return;
    }

    var projectTotals = {};
    var projectDisplayNames = {};
    var projectTasks = {};
    
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (projectTotals[entry.project]) {
            projectTotals[entry.project] += entry.duration;
            if (entry.taskDetails && !projectTasks[entry.project].includes(entry.taskDetails)) {
                projectTasks[entry.project].push(entry.taskDetails);
            }
        } else {
            projectTotals[entry.project] = entry.duration;
            projectDisplayNames[entry.project] = entry.originalProject || entry.project;
            projectTasks[entry.project] = entry.taskDetails ? [entry.taskDetails] : [];
        }
    }

    var grandTotal = 0;
    var html = '<table class="table table-sm mb-0">';
    html += '<thead><tr><th>Project</th><th>Tasks</th><th class="text-end">Total Hours</th></tr></thead>';
    html += '<tbody>';
    
    for (var project in projectTotals) {
        if (projectTotals.hasOwnProperty(project)) {
            var hours = projectTotals[project];
            grandTotal += hours;
            var tasksText = projectTasks[project].length > 0 ? projectTasks[project].join(', ') : 'No tasks';
            html += '<tr>';
            html += '<td>' + projectDisplayNames[project] + '</td>';
            html += '<td><small class="text-muted">' + tasksText + '</small></td>';
            html += '<td class="text-end duration-badge">' + hours.toFixed(2) + ' h</td>';
            html += '</tr>';
        }
    }
    
    html += '<tr class="table-primary">';
    html += '<td><strong>Total</strong></td>';
    html += '<td></td>';
    html += '<td class="text-end"><strong class="duration-badge">' + grandTotal.toFixed(2) + ' h</strong></td>';
    html += '</tr>';
    html += '</tbody></table>';
    
    summaryTable.innerHTML = html;
    
    // Update donut chart
    updateDonutChart(projectTotals, projectDisplayNames);
}

var donutChart = null;

function updateDonutChart(projectTotals, projectDisplayNames) {
    var ctx = document.getElementById('donutChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (donutChart) {
        donutChart.destroy();
    }
    
    if (Object.keys(projectTotals).length === 0) {
        ctx.clearRect(0, 0, 300, 300);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', 150, 150);
        return;
    }
    
    var labels = [];
    var data = [];
    var backgroundColors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', 
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];
    
    for (var project in projectTotals) {
        if (projectTotals.hasOwnProperty(project)) {
            labels.push(projectDisplayNames[project]);
            data.push(projectTotals[project]);
        }
    }
    
    donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var total = context.dataset.data.reduce((a, b) => a + b, 0);
                            var percentage = ((context.raw / total) * 100).toFixed(1);
                            return context.label + ': ' + context.raw.toFixed(2) + 'h (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    renderEntries();
    renderSummary();
});
