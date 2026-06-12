document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const statusMessage = document.getElementById('statusMessage');
    const statusText = document.getElementById('statusText');
    const resultsDashboard = document.getElementById('resultsDashboard');
    const downloadBtn = document.getElementById('downloadReport');

    // Handle Upload Area Click
    uploadArea.addEventListener('click', () => pdfInput.click());

    // Handle File Selection
    pdfInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            await processReport(file);
        }
    });

    // Handle Drag and Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });

    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            await processReport(file);
        }
    });

    async function processReport(file) {
        // UI Feedback
        statusMessage.classList.remove('hidden');
        uploadArea.classList.add('hidden');
        resultsDashboard.classList.add('hidden');
        statusText.textContent = "Extracting data from PDF...";

        try {
            // Convert file to base64 to send to NiceGUI
            const base64 = await fileToBase64(file);
            
            // Call NiceGUI function (we will define this in ui.py)
            const response = await window.runAnalysis(base64);
            
            if (response.error) {
                throw new Error(response.error);
            }

            renderResults(response.data);
            
            statusMessage.classList.add('hidden');
            resultsDashboard.classList.remove('hidden');
            resultsDashboard.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error(error);
            statusText.textContent = "Error: " + error.message;
            statusText.style.color = 'var(--danger)';
            uploadArea.classList.remove('hidden');
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
    }

    function renderResults(data) {
        // 1. Overview
        const overview = data.overview || {};
        document.getElementById('predictedCondition').textContent = overview.condition || 'Unknown';
        document.getElementById('analysisSummary').textContent = overview.summary || 'No summary available.';
        
        const severityBadge = document.getElementById('severityBadge');
        const severity = (overview.severity || 'Normal').toLowerCase();
        severityBadge.textContent = overview.severity || 'Normal';
        severityBadge.className = `badge ${severity}`;

        // 2. Health Impact
        const healthEffectsList = document.getElementById('healthEffectsList');
        renderList(healthEffectsList, data.health_effects || data.quick_summary || []);

        // 3. Abnormal Findings
        const findingsBody = document.getElementById('findingsBody');
        findingsBody.innerHTML = '';
        (data.abnormal_findings || []).forEach(finding => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${finding.parameter}</strong></td>
                <td><span class="badge ${finding.status.toLowerCase() === 'high' || finding.status.toLowerCase() === 'low' ? 'danger' : 'normal'}">${finding.status}</span></td>
                <td>${finding.explanation || finding.impact || ''}</td>
            `;
            findingsBody.appendChild(row);
        });

        // 4. Specialist Recommendation
        const specialist = data.recommended_specialist || {};
        document.getElementById('specialistName').textContent = specialist.name || 'General Practitioner';
        document.getElementById('specialistReason').textContent = specialist.reason || 'Regular checkup recommended.';

        // 5. Diet Plan
        const diet = data.diet_plan || {};
        renderList(document.getElementById('breakfastList'), diet.breakfast || []);
        renderList(document.getElementById('lunchList'), diet.lunch || []);
        renderList(document.getElementById('dinnerList'), diet.dinner || []);
        renderList(document.getElementById('snacksList'), diet.snacks || []);

        // 6. Daily Routine Timeline
        const routineTimeline = document.getElementById('routineTimeline');
        routineTimeline.innerHTML = '';
        (data.daily_plan || []).forEach(item => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-time">${item.time}</div>
                <div class="timeline-activity">${item.activity}</div>
            `;
            routineTimeline.appendChild(timelineItem);
        });

        // 7. Exercise & Hydration
        const exercise = data.exercise || {};
        document.getElementById('exerciseDuration').textContent = exercise.duration || '30 mins';
        renderList(document.getElementById('exerciseActivities'), exercise.activities || []);

        const hydration = data.hydration || {};
        document.getElementById('hydrationTarget').textContent = hydration.target || '2.5L';
        document.getElementById('hydrationTip').textContent = hydration.tip || '';

        // 8. Monitoring Checklist
        const monitoringList = document.getElementById('monitoringList');
        monitoringList.innerHTML = '';
        (data.monitoring || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.task}:</strong> ${item.frequency}`;
            monitoringList.appendChild(li);
        });

        // 9. Prevention Tips
        renderList(document.getElementById('preventionTipsList'), data.prevention_tips || []);

        // 10. Warning Signs
        renderList(document.getElementById('warningSignsList'), data.warning_signs || []);

        // 11. Follow-up Tests
        renderList(document.getElementById('followupList'), data.follow_up_tests || data.next_steps || []);
    }

    function renderList(container, items) {
        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = '<li>No specific recommendations.</li>';
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            container.appendChild(li);
        });
    }

    // Download Report Mock functionality
    downloadBtn.addEventListener('click', () => {
        window.print();
    });
});
