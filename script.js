// ===================================
// Mock Data
// ===================================

const mockPolicies = [
    {
        id: 'POL-2024-001',
        holder: 'John Anderson',
        type: 'Commercial Property',
        status: 'pending',
        issues: 5,
        lastUpdated: '2025-12-08',
        coverage: '$2,500,000',
        reviewDate: 'December 10, 2025'
    },
    {
        id: 'POL-2024-002',
        holder: 'Sarah Mitchell',
        type: 'General Liability',
        status: 'review',
        issues: 3,
        lastUpdated: '2025-12-09',
        coverage: '$1,000,000',
        reviewDate: 'December 9, 2025'
    },
    {
        id: 'POL-2024-003',
        holder: 'Tech Solutions Inc.',
        type: 'Professional Liability',
        status: 'completed',
        issues: 0,
        lastUpdated: '2025-12-07',
        coverage: '$5,000,000',
        reviewDate: 'December 7, 2025'
    },
    {
        id: 'POL-2024-004',
        holder: 'Green Valley Farms',
        type: 'Agricultural Insurance',
        status: 'pending',
        issues: 7,
        lastUpdated: '2025-12-10',
        coverage: '$3,200,000',
        reviewDate: 'December 10, 2025'
    },
    {
        id: 'POL-2024-005',
        holder: 'Metro Construction',
        type: 'Workers Compensation',
        status: 'review',
        issues: 2,
        lastUpdated: '2025-12-09',
        coverage: '$2,000,000',
        reviewDate: 'December 9, 2025'
    }
];

const mockDiscrepancies = [
    {
        field: 'Coverage Amount',
        expected: '$2,500,000',
        actual: '$2,450,000',
        severity: 'high',
        description: 'Coverage amount in policy document does not match the declared value in the application form.'
    },
    {
        field: 'Property Address',
        expected: '123 Main Street, Suite 400',
        actual: '123 Main St, Ste 400',
        severity: 'low',
        description: 'Address format inconsistency between documents. Standardization required.'
    },
    {
        field: 'Deductible Amount',
        expected: '$10,000',
        actual: '$15,000',
        severity: 'high',
        description: 'Deductible amount mismatch requires immediate correction and policyholder notification.'
    },
    {
        field: 'Policy Effective Date',
        expected: '2025-01-01',
        actual: '2025-01-15',
        severity: 'medium',
        description: 'Effective date discrepancy may affect coverage period calculations.'
    },
    {
        field: 'Named Insured',
        expected: 'John Anderson DBA Anderson Enterprises',
        actual: 'John Anderson',
        severity: 'medium',
        description: 'Business entity designation missing from named insured field.'
    }
];

const mockCoverageItems = [
    {
        type: 'Building Coverage',
        limit: '$2,000,000',
        status: 'active',
        notes: 'Replacement cost basis with agreed value endorsement'
    },
    {
        type: 'Business Personal Property',
        limit: '$500,000',
        status: 'active',
        notes: 'Includes equipment, inventory, and fixtures'
    },
    {
        type: 'Business Interruption',
        limit: '$750,000',
        status: 'active',
        notes: '12-month indemnity period with extended period endorsement'
    },
    {
        type: 'Equipment Breakdown',
        limit: '$250,000',
        status: 'active',
        notes: 'Covers mechanical and electrical equipment failures'
    }
];

const mockEndorsements = [
    {
        code: 'CP-10-30',
        name: 'Causes of Loss - Special Form',
        status: 'active',
        effectiveDate: '2025-01-01'
    },
    {
        code: 'CP-04-18',
        name: 'Additional Insured - Owners, Lessees',
        status: 'active',
        effectiveDate: '2025-01-01'
    },
    {
        code: 'CP-15-10',
        name: 'Ordinance or Law Coverage',
        status: 'active',
        effectiveDate: '2025-01-01'
    }
];

const mockRiskItems = [
    {
        category: 'Property Risk',
        level: 'medium',
        description: 'Building age (25 years) requires enhanced maintenance protocols',
        recommendation: 'Annual building inspection recommended'
    },
    {
        category: 'Location Risk',
        level: 'low',
        description: 'Property located in low flood zone area',
        recommendation: 'Flood insurance optional but recommended'
    },
    {
        category: 'Occupancy Risk',
        level: 'medium',
        description: 'Mixed-use occupancy requires specific coverage considerations',
        recommendation: 'Review tenant operations quarterly'
    }
];

// ===================================
// Initialization
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Load initial data
    loadPoliciesTable();
    loadComparisonData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
});

// ===================================
// Navigation
// ===================================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewName = this.getAttribute('data-view');
            showView(viewName);
            
            // Update active state
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // Reinitialize icons after view change
    setTimeout(() => lucide.createIcons(), 100);
}

// ===================================
// Dashboard Functions
// ===================================

function loadPoliciesTable() {
    const tbody = document.getElementById('policies-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = mockPolicies.map(policy => `
        <tr>
            <td><strong>${policy.id}</strong></td>
            <td>${policy.holder}</td>
            <td>${policy.type}</td>
            <td>
                <span class="status-badge status-${policy.status}">
                    ${policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                </span>
            </td>
            <td>
                ${policy.issues > 0 
                    ? `<span class="badge badge-warning">${policy.issues} issues</span>`
                    : `<span class="badge badge-success">No issues</span>`
                }
            </td>
            <td>${formatDate(policy.lastUpdated)}</td>
            <td>
                <button class="btn-secondary" onclick="viewPolicy('${policy.id}')">
                    <i data-lucide="eye"></i>
                    Review
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

function viewPolicy(policyId) {
    const policy = mockPolicies.find(p => p.id === policyId);
    if (!policy) return;
    
    // Update comparison view with policy data
    document.getElementById('selected-policy-id').textContent = policy.id;
    document.getElementById('policy-holder').textContent = policy.holder;
    document.getElementById('policy-type').textContent = policy.type;
    document.getElementById('coverage-amount').textContent = policy.coverage;
    document.getElementById('review-date').textContent = policy.reviewDate;
    
    // Show comparison view
    showView('comparison');
    
    // Update nav button active state
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-view="comparison"]').classList.add('active');
}

// ===================================
// Comparison Functions
// ===================================

function loadComparisonData() {
    loadDiscrepancies();
    loadCoverageItems();
    loadEndorsements();
    loadRiskItems();
}

function loadDiscrepancies() {
    const container = document.getElementById('discrepancy-list');
    if (!container) return;
    
    document.getElementById('discrepancy-count').textContent = `${mockDiscrepancies.length} Issues`;
    
    container.innerHTML = mockDiscrepancies.map(item => `
        <div class="discrepancy-item">
            <div class="item-header">
                <span class="item-title">${item.field}</span>
                <span class="badge badge-${getSeverityBadge(item.severity)}">${item.severity.toUpperCase()}</span>
            </div>
            <div class="item-description">${item.description}</div>
            <div class="item-meta">
                <span><strong>Expected:</strong> ${item.expected}</span>
                <span><strong>Actual:</strong> ${item.actual}</span>
            </div>
        </div>
    `).join('');
}

function loadCoverageItems() {
    const container = document.getElementById('coverage-items');
    if (!container) return;
    
    container.innerHTML = mockCoverageItems.map(item => `
        <div class="coverage-item">
            <div class="item-header">
                <span class="item-title">${item.type}</span>
                <span class="badge badge-success">${item.limit}</span>
            </div>
            <div class="item-description">${item.notes}</div>
        </div>
    `).join('');
}

function loadEndorsements() {
    const container = document.getElementById('endorsement-list');
    if (!container) return;
    
    document.getElementById('endorsement-count').textContent = `${mockEndorsements.length} Active`;
    
    container.innerHTML = mockEndorsements.map(item => `
        <div class="endorsement-item">
            <div class="item-header">
                <span class="item-title">${item.code}</span>
                <span class="badge badge-success">${item.status.toUpperCase()}</span>
            </div>
            <div class="item-description">${item.name}</div>
            <div class="item-meta">
                <span><strong>Effective:</strong> ${formatDate(item.effectiveDate)}</span>
            </div>
        </div>
    `).join('');
}

function loadRiskItems() {
    const container = document.getElementById('risk-items');
    if (!container) return;
    
    container.innerHTML = mockRiskItems.map(item => `
        <div class="risk-item">
            <div class="item-header">
                <span class="item-title">${item.category}</span>
                <span class="badge badge-${getRiskBadge(item.level)}">${item.level.toUpperCase()}</span>
            </div>
            <div class="item-description">${item.description}</div>
            <div class="item-meta">
                <span><strong>Recommendation:</strong> ${item.recommendation}</span>
            </div>
        </div>
    `).join('');
}

// ===================================
// Letter Generation
// ===================================

function generateLetter() {
    const letterType = document.getElementById('letter-type').value;
    const letterTone = document.getElementById('letter-tone').value;
    const letterContent = document.getElementById('letter-content');
    
    // Show loading
    showLoading();
    
    // Simulate processing delay
    setTimeout(() => {
        const letter = createLetter(letterType, letterTone);
        letterContent.innerHTML = letter;
        hideLoading();
        lucide.createIcons();
    }, 1500);
}

function createLetter(type, tone) {
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const greeting = tone === 'formal' ? 'Dear' : tone === 'friendly' ? 'Hello' : 'Dear';
    
    return `
        <div class="letter-date">${today}</div>
        
        <div class="letter-recipient">
            <p><strong>John Anderson</strong></p>
            <p>Anderson Enterprises</p>
            <p>123 Main Street, Suite 400</p>
            <p>Springfield, IL 62701</p>
        </div>
        
        <div class="letter-subject">
            <strong>RE: Policy Review Notice - Policy Number POL-2024-001</strong>
        </div>
        
        <div class="letter-body">
            <p>${greeting} Mr. Anderson,</p>
            
            <p>We have completed our comprehensive review of your Commercial Property Insurance policy (Policy Number: POL-2024-001). This letter outlines the findings from our analysis and the required actions to ensure your policy documentation is accurate and complete.</p>
            
            <div class="letter-section">
                <h4>Review Summary</h4>
                <p>Our automated policy review system has identified several discrepancies between your policy documents and the information in our records. These items require your attention to ensure proper coverage and compliance with underwriting standards.</p>
            </div>
            
            <div class="letter-section">
                <h4>Identified Discrepancies</h4>
                <p>The following discrepancies were found during our review:</p>
                <ul class="letter-list">
                    ${mockDiscrepancies.map(d => `
                        <li><strong>${d.field}:</strong> ${d.description} (Severity: ${d.severity.toUpperCase()})</li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="letter-section">
                <h4>Required Actions</h4>
                <p>To resolve these discrepancies, please take the following actions within 15 business days:</p>
                <ul class="letter-list">
                    <li>Review the attached detailed comparison report</li>
                    <li>Verify the correct information for each identified discrepancy</li>
                    <li>Complete and return the enclosed Policy Amendment Form</li>
                    <li>Provide supporting documentation for any changes requested</li>
                    <li>Contact our office if you have questions or need clarification</li>
                </ul>
            </div>
            
            <div class="letter-section">
                <h4>Coverage Impact</h4>
                <p>Please note that the identified discrepancies, particularly those marked as HIGH severity, may affect your coverage. We recommend addressing these items promptly to ensure there are no gaps in your protection.</p>
            </div>
            
            <div class="letter-section">
                <h4>Next Steps</h4>
                <p>Our underwriting team is available to assist you with this review process. Please contact us at (555) 123-4567 or email us at underwriting@insurance.com to schedule a consultation or if you have any questions.</p>
            </div>
            
            <p>We appreciate your prompt attention to this matter and look forward to continuing to serve your insurance needs.</p>
        </div>
        
        <div class="letter-signature">
            <p><strong>Sincerely,</strong></p>
            <p style="margin-top: 2rem;"><strong>Policy Review Department</strong></p>
            <p>Insurance Services Division</p>
            <p>Phone: (555) 123-4567</p>
            <p>Email: underwriting@insurance.com</p>
        </div>
    `;
}

// ===================================
// Event Listeners
// ===================================

function setupEventListeners() {
    // Letter type change
    const letterType = document.getElementById('letter-type');
    if (letterType) {
        letterType.addEventListener('change', function() {
            // Clear current letter when type changes
            const letterContent = document.getElementById('letter-content');
            if (letterContent && !letterContent.querySelector('.letter-placeholder')) {
                letterContent.innerHTML = `
                    <div class="letter-placeholder">
                        <i data-lucide="file-text"></i>
                        <p>Click "Generate Letter" to create a review letter based on the policy analysis</p>
                    </div>
                `;
                lucide.createIcons();
            }
        });
    }
}

// ===================================
// Utility Functions
// ===================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getSeverityBadge(severity) {
    const badges = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'info'
    };
    return badges[severity] || 'info';
}

function getRiskBadge(level) {
    const badges = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'success'
    };
    return badges[level] || 'info';
}

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ===================================
// Export Functions (for demo purposes)
// ===================================

function exportReport() {
    alert('Export functionality would generate a PDF report with all comparison data.');
}

function copyLetter() {
    const letterContent = document.getElementById('letter-content');
    if (letterContent) {
        const text = letterContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('Letter copied to clipboard!');
        });
    }
}

function downloadLetter() {
    alert('Download functionality would generate a PDF version of the letter.');
}

function sendLetter() {
    alert('Send functionality would email the letter to the policyholder.');
}