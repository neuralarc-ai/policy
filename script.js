// ===================================
// STATE MANAGEMENT
// ===================================
let package1Data = null;
let package2Data = null;
let selectedDoc1 = null;
let selectedDoc2 = null;
let comparisonData = null;
let editHistory = [];
let overviewChart = null;
let fieldTypeChart = null;

// ===================================
// INSURANCE TERM SYNONYMS
// ===================================
const insuranceSynonyms = {
    // Coverage terms
    'coverage': ['covered', 'protection', 'insured'],
    'limit': ['maximum', 'cap', 'ceiling'],
    'deductible': ['retention', 'self-insured retention', 'sir'],
    'premium': ['cost', 'price', 'rate'],
    'exclusion': ['excluded', 'not covered', 'exception'],
    'endorsement': ['rider', 'amendment', 'addendum', 'form'],
    'aggregate': ['total', 'combined', 'cumulative'],
    'occurrence': ['incident', 'event', 'claim'],
    'insured': ['policyholder', 'named insured', 'assured'],
    'carrier': ['insurer', 'insurance company', 'underwriter'],
    'effective date': ['inception date', 'start date', 'commencement date'],
    'expiration date': ['end date', 'termination date', 'expiry date'],
    'sublimit': ['sub-limit', 'per item limit', 'specific limit'],
    'liability': ['legal liability', 'third party liability'],
    'property': ['physical damage', 'property damage'],
    // Common abbreviations
    'gl': ['general liability', 'cgl', 'commercial general liability'],
    'wc': ['workers compensation', 'workers comp'],
    'auto': ['automobile', 'vehicle', 'commercial auto'],
    'e&o': ['errors and omissions', 'professional liability'],
    'bop': ['businessowners policy', 'business owners'],
    'epl': ['employment practices liability'],
    'd&o': ['directors and officers'],
    // Yes/No variations
    'yes': ['y', 'included', 'covered', 'applicable'],
    'no': ['n', 'not included', 'not covered', 'not applicable', 'n/a'],
    'included': ['yes', 'covered', 'attached'],
    'excluded': ['no', 'not covered', 'not attached']
};

// Pending verifications for human approval
let pendingVerifications = [];

// ===================================
// SEMANTIC MATCHING
// ===================================
function areValuesSemanticallyEqual(val1, val2) {
    const norm1 = normalizeValue(val1);
    const norm2 = normalizeValue(val2);
    
    // Exact match
    if (norm1 === norm2) return { match: true, confidence: 'exact' };
    
    // Empty values
    if (!norm1 && !norm2) return { match: true, confidence: 'exact' };
    if (!norm1 || !norm2) return { match: false, confidence: 'exact' };
    
    // Try date matching first
    const dateMatch = areDatesEqual(val1, val2);
    if (dateMatch.isDate) {
        return { match: dateMatch.match, confidence: dateMatch.match ? 'exact' : 'different' };
    }
    
    // Check synonyms
    const lower1 = norm1.toLowerCase();
    const lower2 = norm2.toLowerCase();
    
    for (const [term, synonyms] of Object.entries(insuranceSynonyms)) {
        const allTerms = [term, ...synonyms].map(t => t.toLowerCase());
        
        if (allTerms.includes(lower1) && allTerms.includes(lower2)) {
            return { match: true, confidence: 'synonym' };
        }
    }
    
    // Fuzzy string matching for potential synonyms
    const similarity = calculateStringSimilarity(lower1, lower2);
    if (similarity > 0.85) {
        return { match: true, confidence: 'high' };
    } else if (similarity > 0.7) {
        return { match: false, confidence: 'ambiguous' };
    }
    
    return { match: false, confidence: 'different' };
}

// ===================================
// INTELLIGENT DATE MATCHING
// ===================================
function areDatesEqual(val1, val2) {
    const date1 = parseFlexibleDate(val1);
    const date2 = parseFlexibleDate(val2);
    
    if (!date1 || !date2) {
        return { isDate: false, match: false };
    }
    
    // Compare normalized dates
    const match = date1.getTime() === date2.getTime();
    return { isDate: true, match: match };
}

function parseFlexibleDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    const cleaned = dateStr.trim();
    
    // Try standard Date parsing first
    let date = new Date(cleaned);
    if (!isNaN(date.getTime())) return date;
    
    // Parse common date formats
    const formats = [
        // MM/DD/YYYY or MM-DD-YYYY
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
        // DD/MM/YYYY or DD-MM-YYYY
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
        // YYYY/MM/DD or YYYY-MM-DD
        /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
        // Month DD, YYYY (e.g., "January 15, 2025")
        /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
        // DD Month YYYY (e.g., "15 January 2025")
        /^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/,
        // Month YYYY (e.g., "January 2025")
        /^([A-Za-z]+)\s+(\d{4})$/
    ];
    
    const monthNames = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
    };
    
    // Try each format
    for (const format of formats) {
        const match = cleaned.match(format);
        if (match) {
            try {
                if (format.source.includes('[A-Za-z]')) {
                    // Handle month names
                    const monthStr = match[1] || match[2];
                    const month = monthNames[monthStr.toLowerCase()];
                    
                    if (month !== undefined) {
                        if (match.length === 4) {
                            // Month DD, YYYY or DD Month YYYY
                            const day = parseInt(match[2] || match[1]);
                            const year = parseInt(match[3]);
                            date = new Date(year, month, day);
                        } else if (match.length === 3) {
                            // Month YYYY
                            const year = parseInt(match[2]);
                            date = new Date(year, month, 1);
                        }
                        
                        if (!isNaN(date.getTime())) return date;
                    }
                } else {
                    // Handle numeric dates
                    const parts = match.slice(1).map(p => parseInt(p));
                    
                    if (format.source.startsWith('^(\\d{4})')) {
                        // YYYY-MM-DD
                        date = new Date(parts[0], parts[1] - 1, parts[2]);
                    } else {
                        // Try MM/DD/YYYY
                        date = new Date(parts[2], parts[0] - 1, parts[1]);
                        if (isNaN(date.getTime())) {
                            // Try DD/MM/YYYY
                            date = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    }
                    
                    if (!isNaN(date.getTime())) return date;
                }
            } catch (e) {
                continue;
            }
        }
    }
    
    return null;
}

// Calculate string similarity (Levenshtein-based)
function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// ===================================
// UPDATED COMPARISON STATUS
// ===================================
function getComparisonStatus(val1, val2, fieldName) {
    const semanticResult = areValuesSemanticallyEqual(val1, val2);
    
    if (semanticResult.match === true) {
        return 'match';
    } else if (semanticResult.match === 'ambiguous') {
        // Add to pending verifications
        pendingVerifications.push({
            fieldName,
            value1: val1,
            value2: val2,
            similarity: semanticResult.similarity
        });
        return 'ambiguous';
    } else if (!val1 || !val2) {
        return 'missing';
    } else {
        return 'diff';
    }
}

// Display text for missing values
function getMissingText() {
    return 'Not Present';
}

// Display value with Not Present fallback
function getDisplayValue(value) {
    return value || 'Not Present';
}

// ===================================
// INTELLIGENT TABLE ROW MATCHING
// ===================================
function matchTableRows(table1, table2) {
    const matches = [];
    const unmatchedTable1 = [...table1];
    const unmatchedTable2 = [...table2];
    
    // First pass: Try to match rows by content similarity
    table1.forEach((row1, idx1) => {
        let bestMatch = null;
        let bestScore = 0;
        let bestIdx = -1;
        
        unmatchedTable2.forEach((row2, idx2) => {
            const score = calculateRowSimilarity(row1, row2);
            if (score > bestScore && score > 0.7) { // 70% similarity threshold
                bestScore = score;
                bestMatch = row2;
                bestIdx = idx2;
            }
        });
        
        if (bestMatch) {
            matches.push({
                row1: row1,
                row2: bestMatch,
                matchType: 'content',
                similarity: bestScore
            });
            unmatchedTable1.splice(unmatchedTable1.indexOf(row1), 1);
            unmatchedTable2.splice(bestIdx, 1);
        }
    });
    
    // Second pass: Match remaining rows by position
    const remaining = Math.min(unmatchedTable1.length, unmatchedTable2.length);
    for (let i = 0; i < remaining; i++) {
        matches.push({
            row1: unmatchedTable1[i],
            row2: unmatchedTable2[i],
            matchType: 'position',
            similarity: 0
        });
    }
    
    // Add unmatched rows
    unmatchedTable1.slice(remaining).forEach(row => {
        matches.push({
            row1: row,
            row2: null,
            matchType: 'unmatched',
            similarity: 0
        });
    });
    
    unmatchedTable2.slice(remaining).forEach(row => {
        matches.push({
            row1: null,
            row2: row,
            matchType: 'unmatched',
            similarity: 0
        });
    });
    
    return matches;
}

// Calculate similarity between two table rows
function calculateRowSimilarity(row1, row2) {
    const columns1 = Object.keys(row1.columns);
    const columns2 = Object.keys(row2.columns);
    
    // Get common columns
    const commonColumns = columns1.filter(col => columns2.includes(col));
    if (commonColumns.length === 0) return 0;
    
    let totalSimilarity = 0;
    let comparedColumns = 0;
    
    commonColumns.forEach(col => {
        const val1 = row1.columns[col]?.value || '';
        const val2 = row2.columns[col]?.value || '';
        
        if (val1 || val2) {
            const matchResult = areValuesSemanticallyEqual(val1, val2);
            if (matchResult.match === true) {
                totalSimilarity += 1;
            } else if (matchResult.match === 'ambiguous') {
                totalSimilarity += matchResult.similarity || 0.5;
            }
            comparedColumns++;
        }
    });
    
    return comparedColumns > 0 ? totalSimilarity / comparedColumns : 0;
}

// ===================================
// INTELLIGENT TABLE ROW MATCHING BY DESCRIPTION
// ===================================
function matchTableRowsByContext(table1, table2, columns) {
    if (table1.length === 0 && table2.length === 0) return [];
    
    const matches = [];
    const used2 = new Set();
    
    // Find description/name column (common identifiers)
    const descColumns = columns.filter(col => 
        col.toLowerCase().includes('description') ||
        col.toLowerCase().includes('name') ||
        col.toLowerCase().includes('item') ||
        col.toLowerCase().includes('coverage') ||
        col.toLowerCase().includes('form') ||
        col.toLowerCase().includes('endorsement')
    );
    
    // Match rows by description similarity
    table1.forEach(row1 => {
        let bestMatch = null;
        let bestScore = 0;
        let bestIdx = -1;
        
        table2.forEach((row2, idx2) => {
            if (used2.has(idx2)) return;
            
            // Calculate similarity based on all columns, prioritizing description columns
            let score = 0;
            let totalWeight = 0;
            
            columns.forEach(col => {
                const val1 = row1[col] || '';
                const val2 = row2[col] || '';
                
                if (!val1 && !val2) return;
                
                const weight = descColumns.includes(col) ? 3 : 1; // Description columns weighted 3x
                const matchResult = areValuesSemanticallyEqual(val1, val2);
                
                if (matchResult.match) {
                    score += weight;
                }
                totalWeight += weight;
            });
            
            const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
            
            if (normalizedScore > bestScore) {
                bestScore = normalizedScore;
                bestMatch = row2;
                bestIdx = idx2;
            }
        });
        
        // Match if similarity > 50%
        if (bestMatch && bestScore > 0.5) {
            used2.add(bestIdx);
            
            // Compare each column
            const columnStatus = {};
            columns.forEach(col => {
                const val1 = row1[col] || '';
                const val2 = bestMatch[col] || '';
                
                if (!val1 && !val2) {
                    columnStatus[col] = 'match';
                } else if (!val1 || !val2) {
                    columnStatus[col] = 'missing';
                } else {
                    const matchResult = areValuesSemanticallyEqual(val1, val2);
                    columnStatus[col] = matchResult.match ? 'match' : 'diff';
                }
            });
            
            matches.push({
                row1: row1,
                row2: bestMatch,
                columnStatus: columnStatus,
                matchScore: bestScore
            });
        } else {
            // No good match found - row only in doc1
            const columnStatus = {};
            columns.forEach(col => {
                columnStatus[col] = row1[col] ? 'missing' : 'match';
            });
            
            matches.push({
                row1: row1,
                row2: null,
                columnStatus: columnStatus,
                matchScore: 0
            });
        }
    });
    
    // Add unmatched rows from table2
    table2.forEach((row2, idx2) => {
        if (!used2.has(idx2)) {
            const columnStatus = {};
            columns.forEach(col => {
                columnStatus[col] = row2[col] ? 'missing' : 'match';
            });
            
            matches.push({
                row1: null,
                row2: row2,
                columnStatus: columnStatus,
                matchScore: 0
            });
        }
    });
    
    return matches;
}

// ===================================
// EVENT LISTENERS
// ===================================
document.getElementById('file1').addEventListener('change', (e) => handleFileUpload(e, 1));
document.getElementById('file2').addEventListener('change', (e) => handleFileUpload(e, 2));
document.getElementById('doc1-select').addEventListener('change', handleDocSelection);
document.getElementById('doc2-select').addEventListener('change', handleDocSelection);
document.getElementById('compare-btn').addEventListener('click', initiateComparison);

// ===================================
// FILE UPLOAD HANDLER
// ===================================
async function handleFileUpload(event, packageNum) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (packageNum === 1) {
            package1Data = data;
            displayFileInfo(data, 1);
            populateDocumentSelect(data, 1);
        } else {
            package2Data = data;
            displayFileInfo(data, 2);
            populateDocumentSelect(data, 2);
        }

        if (package1Data && package2Data) {
            showSection('selection-section');
        }
    } catch (error) {
        alert(`Error parsing JSON file: ${error.message}`);
    }
}

function displayFileInfo(data, packageNum) {
    const infoDiv = document.getElementById(`file${packageNum}-info`);
    const batch = data.batch[0];
    
    infoDiv.innerHTML = `
        <strong>Package ID:</strong> ${batch.packageID}<br>
        <strong>Package Name:</strong> ${batch.packageName}<br>
        <strong>Total Files:</strong> ${batch.totalFiles}<br>
        <strong>Status:</strong> ${batch.packageStatus}
    `;
    infoDiv.classList.add('active');
}

function populateDocumentSelect(data, packageNum) {
    const select = document.getElementById(`doc${packageNum}-select`);
    select.innerHTML = '<option value="">-- Select Document --</option>';
    
    const batch = data.batch[0];
    batch.fileNameList.forEach((file, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = file.fileName;
        select.appendChild(option);
    });
}

function handleDocSelection() {
    const doc1Value = document.getElementById('doc1-select').value;
    const doc2Value = document.getElementById('doc2-select').value;
    
    selectedDoc1 = doc1Value ? parseInt(doc1Value) : null;
    selectedDoc2 = doc2Value ? parseInt(doc2Value) : null;
    
    const compareBtn = document.getElementById('compare-btn');
    compareBtn.disabled = selectedDoc1 === null || selectedDoc2 === null;
}

// ===================================
// COMPARISON WORKFLOW
// ===================================
function initiateComparison() {
    showSection('loading-section');
    hideSection('dashboard-section');
    hideSection('comparison-section');
    
    document.getElementById('loading-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
    
    // Animate progress stages
    animateProgressStages();
    
    setTimeout(() => {
        performComparison();
    }, 2000);
}

function animateProgressStages() {
    const stages = document.querySelectorAll('.progress-stages .stage');
    stages.forEach((stage, index) => {
        setTimeout(() => {
            stage.classList.add('active');
        }, index * 500);
    });
}

function performComparison() {
    const doc1 = package1Data.batch[0].fileNameList[selectedDoc1];
    const doc2 = package2Data.batch[0].fileNameList[selectedDoc2];
    
    const doc1Fields = parseFields(doc1.fieldList);
    const doc2Fields = parseFields(doc2.fieldList);
    
    // Reset pending verifications
    pendingVerifications = [];
    
    comparisonData = {
        doc1: doc1,
        doc2: doc2,
        doc1Fields: doc1Fields,
        doc2Fields: doc2Fields,
        stats: calculateStats(doc1Fields, doc2Fields)
    };
    
    hideSection('loading-section');
    showSection('dashboard-section');
    showSection('comparison-section');
    
    document.getElementById('dashboard-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Display actual document names
    document.getElementById('doc1-name').textContent = doc1.fileName;
    document.getElementById('doc2-name').textContent = doc2.fileName;
    
    // Render critical mismatches first
    renderCriticalMismatches(doc1Fields, doc2Fields);
    
    renderDashboard();
    renderHeaderComparisonSideBySide(doc1Fields.headers, doc2Fields.headers);
    renderTableComparisons(doc1Fields.tables, doc2Fields.tables);
    
    lucide.createIcons();
}

// ===================================
// RENDER CRITICAL MISMATCHES
// ===================================
function renderCriticalMismatches(doc1Fields, doc2Fields) {
    const criticalList = document.getElementById('critical-list');
    const criticalCount = document.getElementById('mismatch-count');
    
    const mismatches = [];
    pendingVerifications = []; // Reset
    
    // Collect all mismatches from headers
    const allHeaderFields = new Set([...Object.keys(doc1Fields.headers), ...Object.keys(doc2Fields.headers)]);
    allHeaderFields.forEach(fieldName => {
        const val1 = doc1Fields.headers[fieldName]?.value || '';
        const val2 = doc2Fields.headers[fieldName]?.value || '';
        
        const matchResult = areValuesSemanticallyEqual(val1, val2);
        
        if (!matchResult.match) {
            mismatches.push({
                fieldName: fieldName,
                value1: getDisplayValue(val1),
                value2: getDisplayValue(val2),
                type: 'header',
                isCritical: isCriticalField(fieldName),
                isAmbiguous: false
            });
        } else if (matchResult.match === 'ambiguous') {
            mismatches.push({
                fieldName: fieldName,
                value1: getDisplayValue(val1),
                value2: getDisplayValue(val2),
                type: 'header',
                isCritical: isCriticalField(fieldName),
                isAmbiguous: true
            });
            pendingVerifications.push({
                fieldName: fieldName,
                value1: val1,
                value2: val2,
                type: 'header'
            });
        }
    });
    
    // Collect mismatches from tables using intelligent matching
    Object.keys({...doc1Fields.tables, ...doc2Fields.tables}).forEach(tableName => {
        const table1 = doc1Fields.tables[tableName] || [];
        const table2 = doc2Fields.tables[tableName] || [];
        
        const rowMatches = matchTableRows(table1, table2);
        
        rowMatches.forEach((match, idx) => {
            if (match.matchType === 'unmatched' || match.similarity < 0.9) {
                const row1 = match.row1;
                const row2 = match.row2;
                
                if (row1 && row2) {
                    // Compare columns
                    const allColumns = new Set([
                        ...Object.keys(row1.columns),
                        ...Object.keys(row2.columns)
                    ]);
                    
                    allColumns.forEach(colName => {
                        const val1 = row1.columns[colName]?.value || '';
                        const val2 = row2.columns[colName]?.value || '';
                        
                        const colMatchResult = areValuesSemanticallyEqual(val1, val2);
                        
                        if (!colMatchResult.match) {
                            mismatches.push({
                                fieldName: `${tableName} - ${colName} (Row ${idx + 1})`,
                                value1: getDisplayValue(val1),
                                value2: getDisplayValue(val2),
                                type: 'table',
                                isCritical: isCriticalField(tableName) || isCriticalField(colName),
                                isAmbiguous: false
                            });
                        }
                    });
                }
            }
        });
    });
    
    // Sort by criticality
    mismatches.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        if (a.isAmbiguous && !b.isAmbiguous) return -1;
        if (!a.isAmbiguous && b.isAmbiguous) return 1;
        return 0;
    });
    
    criticalCount.textContent = mismatches.length;
    
    if (mismatches.length === 0) {
        criticalList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--color-match-border); font-weight: 600; font-size: 1.125rem;"><i data-lucide="check-circle-2" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i><br>✓ No critical mismatches found - All key fields match!</div>';
    } else {
        criticalList.innerHTML = mismatches.map(item => `
            <div class="critical-item ${item.isAmbiguous ? 'ambiguous' : ''}">
                <div class="critical-item-icon">
                    <i data-lucide="${item.isAmbiguous ? 'help-circle' : item.isCritical ? 'alert-circle' : 'info'}"></i>
                </div>
                <div class="critical-item-field">
                    <div class="critical-item-label">
                        ${escapeHtml(item.fieldName)}
                        ${item.isAmbiguous ? '<span class="ambiguous-badge">NEEDS REVIEW</span>' : ''}
                    </div>
                </div>
                <div class="critical-item-values">
                    <div class="critical-value">
                        <div class="critical-value-label">Document 1</div>
                        <div class="critical-value-text">${escapeHtml(item.value1)}</div>
                    </div>
                    <div class="critical-value">
                        <div class="critical-value-label">Document 2</div>
                        <div class="critical-value-text">${escapeHtml(item.value2)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Show verification prompt if needed
    if (pendingVerifications.length > 0) {
        showVerificationPrompt();
    }
    
    lucide.createIcons();
}

// ===================================
// SHOW VERIFICATION PROMPT
// ===================================
function showVerificationPrompt() {
    const promptDiv = document.createElement('div');
    promptDiv.className = 'verification-prompt';
    promptDiv.innerHTML = `
        <div class="verification-header">
            <i data-lucide="help-circle"></i>
            <h3>Human Verification Needed</h3>
        </div>
        <p>The following fields have similar but not identical values. Please verify if they should be considered as matches:</p>
        <div class="verification-list">
            ${pendingVerifications.map((item, index) => `
                <div class="verification-item">
                    <div class="verification-field-name">${escapeHtml(item.fieldName)}</div>
                    <div class="verification-values">
                        <div><strong>Doc 1:</strong> ${escapeHtml(item.value1)}</div>
                        <div><strong>Doc 2:</strong> ${escapeHtml(item.value2)}</div>
                    </div>
                    <div class="verification-actions">
                        <button onclick="approveMatch(${index})" class="verify-btn approve">
                            <i data-lucide="check"></i> Same Meaning
                        </button>
                        <button onclick="rejectMatch(${index})" class="verify-btn reject">
                            <i data-lucide="x"></i> Different
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('critical-list').insertAdjacentElement('afterend', promptDiv);
    lucide.createIcons();
}

// Check if field is critical for insurance comparison
function isCriticalField(fieldName) {
    const criticalKeywords = [
        'policy number', 'premium', 'limit', 'deductible', 'retention',
        'coverage', 'insured', 'effective date', 'expiration', 'carrier',
        'endorsement', 'exclusion', 'restriction', 'sublimit', 'aggregate'
    ];
    
    const lowerField = fieldName.toLowerCase();
    return criticalKeywords.some(keyword => lowerField.includes(keyword));
}

// ===================================
// PARSE FIELDS
// ===================================
function parseFields(fieldList) {
    const headers = {};
    const tables = {};
    
    fieldList.forEach(field => {
        const fieldName = field.fieldname;
        const rowId = parseInt(field.rowid);
        
        const isTable = fieldList.filter(f => f.fieldname === fieldName).length > 1;
        
        if (isTable) {
            if (!tables[fieldName]) {
                tables[fieldName] = [];
            }
            
            let row = tables[fieldName].find(r => r.rowid === rowId);
            if (!row) {
                row = { rowid: rowId, columns: {} };
                tables[fieldName].push(row);
            }
            
            row.columns[field.columnname] = {
                value: field.extracteddata,
                confidence: field.confidencescore,
                flag: field.confidenceflag
            };
        } else {
            if (rowId === 1) {
                headers[fieldName] = {
                    value: field.extracteddata,
                    confidence: field.confidencescore,
                    flag: field.confidenceflag
                };
            }
        }
    });
    
    Object.keys(tables).forEach(tableName => {
        tables[tableName].sort((a, b) => a.rowid - b.rowid);
    });
    
    return { headers, tables };
}

// ===================================
// CALCULATE STATISTICS
// ===================================
function calculateStats(doc1Fields, doc2Fields) {
    let matches = 0;
    let diffs = 0;
    let missing = 0;
    let total = 0;
    
    const allHeaderFields = new Set([
        ...Object.keys(doc1Fields.headers),
        ...Object.keys(doc2Fields.headers)
    ]);
    
    allHeaderFields.forEach(fieldName => {
        total++;
        const value1 = doc1Fields.headers[fieldName]?.value || '';
        const value2 = doc2Fields.headers[fieldName]?.value || '';
        
        const status = getComparisonStatus(value1, value2, fieldName);
        
        if (!doc1Fields.headers[fieldName] || !doc2Fields.headers[fieldName]) {
            missing++;
        } else if (status === 'match') {
            matches++;
        } else {
            diffs++;
        }
    });
    
    const allTables = new Set([
        ...Object.keys(doc1Fields.tables),
        ...Object.keys(doc2Fields.tables)
    ]);
    
    allTables.forEach(tableName => {
        const table1Rows = doc1Fields.tables[tableName] || [];
        const table2Rows = doc2Fields.tables[tableName] || [];
        const maxRows = Math.max(table1Rows.length, table2Rows.length);
        
        for (let i = 0; i < maxRows; i++) {
            const row1 = table1Rows[i];
            const row2 = table2Rows[i];
            
            if (row1 && row2) {
                const allColumns = new Set([
                    ...Object.keys(row1.columns),
                    ...Object.keys(row2.columns)
                ]);
                
                allColumns.forEach(col => {
                    total++;
                    const val1 = row1.columns[col]?.value || '';
                    const val2 = row2.columns[col]?.value || '';
                    
                    const status = getComparisonStatus(val1, val2, `${tableName} - ${col}`);
                    
                    if (!val1 || !val2) {
                        missing++;
                    } else if (status === 'match') {
                        matches++;
                    } else {
                        diffs++;
                    }
                });
            }
        }
    });
    
    return { matches, diffs, missing, total };
}

// ===================================
// RENDER DASHBOARD
// ===================================
function renderDashboard() {
    const stats = comparisonData.stats;
    
    document.getElementById('stat-matches').textContent = stats.matches;
    document.getElementById('stat-diffs').textContent = stats.diffs;
    document.getElementById('stat-missing').textContent = stats.missing;
    document.getElementById('stat-total').textContent = stats.total;
    
    renderOverviewChart(stats);
    renderFieldTypeChart();
    renderCoverageAnalysis(comparisonData.doc1Fields, comparisonData.doc2Fields);
    
    document.getElementById('generate-letter-btn').onclick = generateLetter;
    document.getElementById('export-data-btn').onclick = exportData;
}

function renderOverviewChart(stats) {
    const ctx = document.getElementById('overview-chart');
    
    if (overviewChart) {
        overviewChart.destroy();
    }
    
    overviewChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Matches', 'Differences', 'Not Present'],
            datasets: [{
                data: [stats.matches, stats.diffs, stats.missing],
                backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                borderColor: ['#fff', '#fff', '#fff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'SF Mono', 'Consolas', 'Monaco', monospace",
                            size: 11
                        },
                        padding: 12,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                }
            }
        }
    });
}

function renderFieldTypeChart() {
    const ctx = document.getElementById('field-type-chart');
    
    const headerCount = Object.keys(comparisonData.doc1Fields.headers).length;
    const tableCount = Object.keys(comparisonData.doc1Fields.tables).length;
    
    if (fieldTypeChart) {
        fieldTypeChart.destroy();
    }
    
    fieldTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Header Fields', 'Table Fields'],
            datasets: [{
                data: [headerCount, tableCount],
                backgroundColor: ['#171717', '#737373'],
                borderColor: ['#fff', '#fff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'SF Mono', 'Consolas', 'Monaco', monospace",
                            size: 11
                        },
                        padding: 12,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                }
            }
        }
    });
}

// ===================================
// RENDER COVERAGE ANALYSIS
// ===================================
function renderCoverageAnalysis(doc1Fields, doc2Fields) {
    const coverageDiv = document.getElementById('coverage-analysis');
    const endorsementDiv = document.getElementById('endorsement-restrictions');
    const endorsementSection = document.getElementById('endorsement-restrictions-section');
    
    const coverageChanges = [];
    const endorsementRestrictions = [];
    
    // Analyze all fields for coverage-related changes
    const allFields = new Set([...Object.keys(doc1Fields.headers), ...Object.keys(doc2Fields.headers)]);
    
    allFields.forEach(fieldName => {
        const val1 = doc1Fields.headers[fieldName]?.value || '';
        const val2 = doc2Fields.headers[fieldName]?.value || '';
        
        const status = getComparisonStatus(val1, val2, fieldName);
        
        if (isCoverageField(fieldName) && status !== 'match') {
            const change = analyzeCoverageChange(fieldName, val1, val2);
            if (change) {
                coverageChanges.push(change);
            }
        }
    });
    
    // Analyze tables for endorsements and restrictions
    Object.keys(doc1Fields.tables).forEach(tableName => {
        if (isEndorsementTable(tableName)) {
            const restrictions = analyzeEndorsementRestrictions(
                tableName,
                doc1Fields.tables[tableName] || [],
                doc2Fields.tables[tableName] || []
            );
            endorsementRestrictions.push(...restrictions);
        }
    });
    
    // Render coverage changes
    if (coverageChanges.length === 0) {
        coverageDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No coverage changes detected</div>';
    } else {
        coverageDiv.innerHTML = coverageChanges.map(change => `
            <div class="coverage-item ${change.type}">
                <div class="coverage-item-title">
                    <i data-lucide="${change.type === 'increase' ? 'trending-up' : 'trending-down'}"></i>
                    ${escapeHtml(change.fieldName)}
                </div>
                <div class="coverage-item-detail">
                    <strong>Document 1:</strong> ${escapeHtml(change.value1)}<br>
                    <strong>Document 2:</strong> ${escapeHtml(change.value2)}<br>
                    <strong>Impact:</strong> ${escapeHtml(change.impact)}
                </div>
            </div>
        `).join('');
    }
    
    // Render endorsement restrictions - hide section if empty
    if (endorsementRestrictions.length > 0) {
        endorsementSection.style.display = 'block';
        endorsementDiv.innerHTML = endorsementRestrictions.map(restriction => `
            <div class="endorsement-restriction">
                <div class="coverage-item-title">
                    <i data-lucide="shield-x"></i>
                    ${escapeHtml(restriction.endorsementName)}
                </div>
                <div class="coverage-item-detail">
                    <strong>Type:</strong> ${escapeHtml(restriction.restrictionType)}<br>
                    <strong>Details:</strong> ${escapeHtml(restriction.details)}<br>
                    <strong>Impact:</strong> ${escapeHtml(restriction.impact)}
                </div>
            </div>
        `).join('');
    } else {
        endorsementSection.style.display = 'none';
    }
    
    lucide.createIcons();
}

// Check if field is coverage-related
function isCoverageField(fieldName) {
    const coverageKeywords = [
        'limit', 'coverage', 'deductible', 'retention', 'premium',
        'sublimit', 'aggregate', 'occurrence', 'per claim'
    ];
    const lowerField = fieldName.toLowerCase();
    return coverageKeywords.some(keyword => lowerField.includes(keyword));
}

// Check if table contains endorsements
function isEndorsementTable(tableName) {
    const endorsementKeywords = [
        'endorsement', 'form', 'policy form', 'coverage form',
        'exclusion', 'limitation', 'restriction'
    ];
    const lowerTable = tableName.toLowerCase();
    return endorsementKeywords.some(keyword => lowerTable.includes(keyword));
}

// Analyze coverage change impact
function analyzeCoverageChange(fieldName, val1, val2) {
    const num1 = parseFloat(val1.replace(/[^0-9.-]/g, ''));
    const num2 = parseFloat(val2.replace(/[^0-9.-]/g, ''));
    
    let type = 'restriction';
    let impact = '';
    
    if (!isNaN(num1) && !isNaN(num2)) {
        if (num2 > num1) {
            type = 'increase';
            impact = `Coverage increased by ${((num2 - num1) / num1 * 100).toFixed(1)}%`;
        } else if (num2 < num1) {
            type = 'restriction';
            impact = `Coverage decreased by ${((num1 - num2) / num1 * 100).toFixed(1)}%`;
        }
    } else {
        // Qualitative analysis
        const restrictionKeywords = ['exclude', 'not covered', 'limitation', 'restrict', 'reduce'];
        const increaseKeywords = ['include', 'add', 'extend', 'increase', 'enhance'];
        
        const val2Lower = val2.toLowerCase();
        
        if (restrictionKeywords.some(kw => val2Lower.includes(kw))) {
            type = 'restriction';
            impact = 'Coverage may be restricted or limited';
        } else if (increaseKeywords.some(kw => val2Lower.includes(kw))) {
            type = 'increase';
            impact = 'Coverage may be enhanced or extended';
        } else {
            impact = 'Coverage terms have changed';
        }
    }
    
    return {
        fieldName,
        value1: val1,
        value2: val2,
        type,
        impact
    };
}

// Analyze endorsement restrictions
function analyzeEndorsementRestrictions(tableName, table1, table2) {
    const restrictions = [];
    
    // Keywords that indicate restrictions
    const restrictionKeywords = [
        'exclusion', 'exclude', 'not covered', 'limitation', 'limit',
        'restrict', 'reduction', 'sublimit', 'cap', 'maximum',
        'deductible increase', 'retention increase', 'waiting period'
    ];
    
    // Analyze each row for restrictions
    table2.forEach((row, index) => {
        const formName = row.columns['Form Name']?.value || row.columns['Form No']?.value || `Row ${index + 1}`;
        const summary = row.columns['Summary']?.value || '';
        const formNo = row.columns['Form No']?.value || '';
        
        const summaryLower = summary.toLowerCase();
        const hasRestriction = restrictionKeywords.some(kw => summaryLower.includes(kw));
        
        if (hasRestriction) {
            // Determine restriction type
            let restrictionType = 'General Restriction';
            if (summaryLower.includes('exclusion') || summaryLower.includes('exclude')) {
                restrictionType = 'Coverage Exclusion';
            } else if (summaryLower.includes('sublimit') || summaryLower.includes('cap')) {
                restrictionType = 'Coverage Sublimit';
            } else if (summaryLower.includes('deductible') || summaryLower.includes('retention')) {
                restrictionType = 'Increased Deductible/Retention';
            } else if (summaryLower.includes('limitation') || summaryLower.includes('limit')) {
                restrictionType = 'Coverage Limitation';
            }
            
            restrictions.push({
                endorsementName: formName,
                formNumber: formNo,
                restrictionType: restrictionType,
                details: summary,
                impact: determineRestrictionImpact(summaryLower)
            });
        }
    });
    
    return restrictions;
}

// Determine restriction impact
function determineRestrictionImpact(summaryLower) {
    if (summaryLower.includes('total exclusion') || summaryLower.includes('not covered')) {
        return 'CRITICAL: Complete exclusion of coverage';
    } else if (summaryLower.includes('sublimit')) {
        return 'HIGH: Coverage capped at sublimit amount';
    } else if (summaryLower.includes('deductible increase')) {
        return 'MEDIUM: Higher out-of-pocket costs';
    } else if (summaryLower.includes('waiting period')) {
        return 'MEDIUM: Delayed coverage activation';
    } else {
        return 'Coverage scope is restricted';
    }
}

// ===================================
// RENDER HEADER COMPARISON (SIDE BY SIDE)
// ===================================
function renderHeaderComparisonSideBySide(headers1, headers2) {
    const doc1Container = document.getElementById('header-doc1');
    const doc2Container = document.getElementById('header-doc2');
    
    doc1Container.innerHTML = '';
    doc2Container.innerHTML = '';
    
    const allFields = new Set([...Object.keys(headers1), ...Object.keys(headers2)]);
    
    allFields.forEach(fieldName => {
        const value1 = headers1[fieldName]?.value || '';
        const value2 = headers2[fieldName]?.value || '';
        
        const status = getComparisonStatus(value1, value2, fieldName);
        
        let status1 = status;
        let status2 = status;
        
        if (!headers1[fieldName]) {
            status1 = 'missing';
        } else if (!headers2[fieldName]) {
            status2 = 'missing';
        }
        
        // Document 1 field
        const item1 = document.createElement('div');
        item1.className = 'field-item';
        item1.innerHTML = `
            <div class="field-item-name">${fieldName}</div>
            <div class="field-item-value ${status1} editable" 
                 data-field="${fieldName}" 
                 data-doc="1"
                 onclick="enableEdit(this)">
                ${value1 || getMissingText()}
            </div>
        `;
        doc1Container.appendChild(item1);
        
        // Document 2 field
        const item2 = document.createElement('div');
        item2.className = 'field-item';
        item2.innerHTML = `
            <div class="field-item-name">${fieldName}</div>
            <div class="field-item-value ${status2} editable" 
                 data-field="${fieldName}" 
                 data-doc="2"
                 onclick="enableEdit(this)">
                ${value2 || getMissingText()}
            </div>
        `;
        doc2Container.appendChild(item2);
    });
}

// ===================================
// RENDER TABLE COMPARISONS
// ===================================
function renderTableComparisons(tables1, tables2) {
    const container = document.getElementById('tables-container');
    container.innerHTML = '';
    
    const allTables = new Set([...Object.keys(tables1), ...Object.keys(tables2)]);
    
    allTables.forEach(tableName => {
        const table1Rows = tables1[tableName] || [];
        const table2Rows = tables2[tableName] || [];
        
        const section = document.createElement('div');
        section.className = 'comparison-block table-section';
        
        const header = document.createElement('div');
        header.className = 'block-header';
        header.innerHTML = `
            <i data-lucide="table"></i>
            <h3>${tableName}</h3>
            <span class="edit-hint">Click any cell to edit</span>
        `;
        section.appendChild(header);
        
        const allColumns = new Set();
        [...table1Rows, ...table2Rows].forEach(row => {
            Object.keys(row.columns).forEach(col => allColumns.add(col));
        });
        const columns = Array.from(allColumns);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        const table = document.createElement('table');
        table.className = 'data-table';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        headerRow.appendChild(createTableHeader('Row'));
        headerRow.appendChild(createTableHeader('Doc'));
        columns.forEach(col => headerRow.appendChild(createTableHeader(col)));
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        // Use intelligent row matching
        const rowMatches = matchTableRows(table1Rows, table2Rows);
        
        rowMatches.forEach((match, idx) => {
            const row1 = match.row1;
            const row2 = match.row2;
            
            if (row1) {
                tbody.appendChild(createTableRow(idx + 1, 'Doc 1', row1, row2, columns, tableName));
            } else {
                tbody.appendChild(createEmptyTableRow(idx + 1, 'Doc 1', columns));
            }
            
            if (row2) {
                tbody.appendChild(createTableRow(idx + 1, 'Doc 2', row2, row1, columns, tableName));
            } else {
                tbody.appendChild(createEmptyTableRow(idx + 1, 'Doc 2', columns));
            }
        });
        
        table.appendChild(tbody);
        wrapper.appendChild(table);
        section.appendChild(wrapper);
        container.appendChild(section);
    });
    
    lucide.createIcons();
}

// ===================================
// HELPER FUNCTIONS
// ===================================
function createTableHeader(text) {
    const th = document.createElement('th');
    th.textContent = text;
    return th;
}

function createTableRow(rowNum, docLabel, currentRow, compareRow, columns, tableName) {
    const tr = document.createElement('tr');
    
    const rowNumCell = document.createElement('td');
    rowNumCell.className = 'row-num';
    rowNumCell.textContent = rowNum;
    tr.appendChild(rowNumCell);
    
    const docCell = document.createElement('td');
    docCell.className = 'doc-label';
    docCell.textContent = docLabel;
    tr.appendChild(docCell);
    
    columns.forEach(col => {
        const td = document.createElement('td');
        const currentValue = currentRow.columns[col]?.value || '';
        const compareValue = compareRow?.columns[col]?.value || '';
        
        td.textContent = currentValue || getMissingText();
        td.className = 'editable';
        td.setAttribute('data-table', tableName);
        td.setAttribute('data-row', rowNum);
        td.setAttribute('data-col', col);
        td.setAttribute('data-doc', docLabel === 'Doc 1' ? '1' : '2');
        td.onclick = function() { enableTableEdit(this); };
        
        const status = getComparisonStatus(currentValue, compareValue, `${tableName} - ${col}`);
        
        if (!currentValue) {
            td.classList.add('missing-cell');
        } else if (!compareValue) {
            td.classList.add('diff-cell');
        } else if (status === 'match') {
            td.classList.add('match-cell');
        } else if (status === 'ambiguous') {
            td.classList.add('ambiguous-cell');
        } else {
            td.classList.add('diff-cell');
        }
        
        tr.appendChild(td);
    });
    
    return tr;
}

function createEmptyTableRow(rowNum, docLabel, columns) {
    const tr = document.createElement('tr');
    
    const rowNumCell = document.createElement('td');
    rowNumCell.className = 'row-num';
    rowNumCell.textContent = rowNum;
    tr.appendChild(rowNumCell);
    
    const docCell = document.createElement('td');
    docCell.className = 'doc-label';
    docCell.textContent = docLabel;
    tr.appendChild(docCell);
    
    columns.forEach(() => {
        const td = document.createElement('td');
        td.className = 'missing-cell';
        td.textContent = getMissingText();
        tr.appendChild(td);
    });
    
    return tr;
}

// ===================================
// INTERACTIVE EDITING
// ===================================
function enableEdit(element) {
    const currentValue = element.textContent;
    const fieldName = element.getAttribute('data-field');
    const docNum = element.getAttribute('data-doc');
    
    element.classList.add('editing');
    element.innerHTML = `<input type="text" value="${currentValue}" onblur="saveEdit(this)" onkeypress="handleEditKeypress(event, this)">`;
    element.querySelector('input').focus();
    element.querySelector('input').select();
}

function enableTableEdit(element) {
    const currentValue = element.textContent;
    
    element.classList.add('editing');
    element.innerHTML = `<input type="text" value="${currentValue}" onblur="saveTableEdit(this)" onkeypress="handleEditKeypress(event, this)">`;
    element.querySelector('input').focus();
    element.querySelector('input').select();
}

function handleEditKeypress(event, input) {
    if (event.key === 'Enter') {
        input.blur();
    }
}

function saveEdit(input) {
    const newValue = input.value;
    const element = input.parentElement;
    const fieldName = element.getAttribute('data-field');
    const docNum = element.getAttribute('data-doc');
    
    element.classList.remove('editing');
    element.textContent = newValue;
    
    // Update data
    if (docNum === '1') {
        comparisonData.doc1Fields.headers[fieldName].value = newValue;
    } else {
        comparisonData.doc2Fields.headers[fieldName].value = newValue;
    }
    
    // Log edit
    editHistory.push({
        timestamp: new Date().toISOString(),
        field: fieldName,
        document: docNum,
        oldValue: input.defaultValue,
        newValue: newValue
    });
    
    // Recalculate and update
    comparisonData.stats = calculateStats(comparisonData.doc1Fields, comparisonData.doc2Fields);
    updateDashboardStats();
    
    // Re-render comparison to update colors
    renderHeaderComparisonSideBySide(comparisonData.doc1Fields.headers, comparisonData.doc2Fields.headers);
}

function saveTableEdit(input) {
    const newValue = input.value;
    const element = input.parentElement;
    
    element.classList.remove('editing');
    element.textContent = newValue;
    
    // Update data and recalculate
    comparisonData.stats = calculateStats(comparisonData.doc1Fields, comparisonData.doc2Fields);
    updateDashboardStats();
}

function updateDashboardStats() {
    const stats = comparisonData.stats;
    document.getElementById('stat-matches').textContent = stats.matches;
    document.getElementById('stat-diffs').textContent = stats.diffs;
    document.getElementById('stat-missing').textContent = stats.missing;
    document.getElementById('stat-total').textContent = stats.total;
    
    if (overviewChart) {
        overviewChart.data.datasets[0].data = [stats.matches, stats.diffs, stats.missing];
        overviewChart.update();
    }
}

// ===================================
// LETTER GENERATION
// ===================================
function generateLetter() {
    const letterContent = createLetterContent();
    document.getElementById('letter-content').innerHTML = letterContent;
    document.getElementById('letter-modal').style.display = 'flex';
    
    document.getElementById('download-letter-btn').onclick = downloadLetter;
    
    lucide.createIcons();
}

function createLetterContent() {
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const doc1Name = comparisonData.doc1.fileName;
    const doc2Name = comparisonData.doc2.fileName;
    const stats = comparisonData.stats;
    
    let html = `
        <div class="letter-header">
            <div class="letter-date">${today}</div>
            <h1 class="letter-title">Document Comparison Report</h1>
            <p class="letter-subtitle">Analysis of Policy Document Differences</p>
        </div>
        
        <div class="letter-section">
            <h3>Executive Summary</h3>
            <p>This report presents a comprehensive comparison between two insurance policy documents. 
            The analysis identified <strong>${stats.diffs} differences</strong>, <strong>${stats.missing} fields not present</strong>, 
            and <strong>${stats.matches} matching fields</strong> across a total of <strong>${stats.total} fields</strong>.</p>
        </div>
        
        <div class="letter-section">
            <h3>Documents Compared</h3>
            <p><strong>Document 1:</strong> ${doc1Name}</p>
            <p><strong>Document 2:</strong> ${doc2Name}</p>
        </div>
    `;
    
    // Coverage Analysis
    const coverageChanges = analyzeCoverageChanges();
    if (coverageChanges.length > 0) {
        html += `
            <div class="letter-section">
                <h3>Coverage Impact Analysis</h3>
                <ul class="letter-list">
        `;
        
        coverageChanges.forEach(change => {
            const className = change.type === 'increase' ? 'coverage-increase' : 'coverage-restriction';
            html += `
                <li class="${className}">
                    <span class="letter-field-name">${change.field}</span>
                    <div class="letter-field-values">
                        <span>Doc 1: ${change.value1}</span>
                        <span>→</span>
                        <span>Doc 2: ${change.value2}</span>
                    </div>
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
        `;
    }
    
    // Header Field Differences
    const headerDiffs = getHeaderDifferences();
    if (headerDiffs.length > 0) {
        html += `
            <div class="letter-section">
                <h3>Header Field Differences</h3>
                <ul class="letter-list">
        `;
        
        headerDiffs.forEach(diff => {
            html += `
                <li class="${diff.type}">
                    <span class="letter-field-name">${diff.field}</span>
                    <div class="letter-field-values">
                        <span>Doc 1: ${diff.value1}</span>
                        <span>→</span>
                        <span>Doc 2: ${diff.value2}</span>
                    </div>
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
        `;
    }
    
    // Table Field Differences
    const tableDiffs = getTableDifferences();
    if (tableDiffs.length > 0) {
        html += `
            <div class="letter-section">
                <h3>Table Field Differences</h3>
                <p>The following discrepancies were found in tabular data:</p>
                <ul class="letter-list">
        `;
        
        tableDiffs.slice(0, 20).forEach(diff => {
            html += `
                <li class="difference">
                    <span class="letter-field-name">${diff.table} - Row ${diff.row} - ${diff.column}</span>
                    <div class="letter-field-values">
                        <span>Doc 1: ${diff.value1}</span>
                        <span>→</span>
                        <span>Doc 2: ${diff.value2}</span>
                    </div>
                </li>
            `;
        });
        
        if (tableDiffs.length > 20) {
            html += `<li><em>... and ${tableDiffs.length - 20} more differences</em></li>`;
        }
        
        html += `
                </ul>
            </div>
        `;
    }
    
    html += `
        <div class="letter-signature">
            <p><strong>Report Generated:</strong> ${today}</p>
            <p><strong>Total Fields Analyzed:</strong> ${stats.total}</p>
            <p><strong>Accuracy Rate:</strong> ${((stats.matches / stats.total) * 100).toFixed(1)}%</p>
        </div>
    `;
    
    return html;
}

function getHeaderDifferences() {
    const diffs = [];
    const headers1 = comparisonData.doc1Fields.headers;
    const headers2 = comparisonData.doc2Fields.headers;
    
    Object.keys(headers1).forEach(fieldName => {
        const val1 = headers1[fieldName]?.value || '';
        const val2 = headers2[fieldName]?.value || '';
        
        if (!headers2[fieldName]) {
            diffs.push({
                field: fieldName,
                value1: val1,
                value2: getMissingText(),
                type: 'missing'
            });
        } else {
            const status = getComparisonStatus(val1, val2, fieldName);
            if (status !== 'match') {
                diffs.push({
                    field: fieldName,
                    value1: val1,
                    value2: val2,
                    type: 'difference'
                });
            }
        }
    });
    
    return diffs;
}

function getTableDifferences() {
    const diffs = [];
    const tables1 = comparisonData.doc1Fields.tables;
    const tables2 = comparisonData.doc2Fields.tables;
    
    Object.keys(tables1).forEach(tableName => {
        const rows1 = tables1[tableName] || [];
        const rows2 = tables2[tableName] || [];
        
        const maxRows = Math.max(rows1.length, rows2.length);
        
        for (let i = 0; i < maxRows; i++) {
            const row1 = rows1[i];
            const row2 = rows2[i];
            
            if (row1 && row2) {
                const allCols = new Set([
                    ...Object.keys(row1.columns),
                    ...Object.keys(row2.columns)
                ]);
                
                allCols.forEach(col => {
                    const val1 = row1.columns[col]?.value || '';
                    const val2 = row2.columns[col]?.value || '';
                    
                    const status = getComparisonStatus(val1, val2, `${tableName} - ${col}`);
                    
                    if (status !== 'match') {
                        diffs.push({
                            table: tableName,
                            row: i + 1,
                            column: col,
                            value1: val1 || getMissingText(),
                            value2: val2 || getMissingText()
                        });
                    }
                });
            }
        }
    });
    
    return diffs;
}

function analyzeCoverageChanges() {
    const changes = [];
    const coverageKeywords = ['limit', 'coverage', 'deductible', 'retention', 'endorsement', 'form'];
    
    const headers1 = comparisonData.doc1Fields.headers;
    const headers2 = comparisonData.doc2Fields.headers;
    
    Object.keys(headers1).forEach(fieldName => {
        const lowerField = fieldName.toLowerCase();
        const isCoverageField = coverageKeywords.some(keyword => lowerField.includes(keyword));
        
        if (isCoverageField && headers2[fieldName]) {
            const val1 = headers1[fieldName].value;
            const val2 = headers2[fieldName].value;
            
            const status = getComparisonStatus(val1, val2, fieldName);
            
            if (status !== 'match') {
                const num1 = parseFloat(val1.replace(/[^0-9.-]/g, ''));
                const num2 = parseFloat(val2.replace(/[^0-9.-]/g, ''));
                
                let type = 'restriction';
                if (!isNaN(num1) && !isNaN(num2) && num2 > num1) {
                    type = 'increase';
                }
                
                changes.push({
                    field: fieldName,
                    value1: val1,
                    value2: val2,
                    type: type
                });
            }
        }
    });
    
    return changes;
}

function downloadLetter() {
    const content = document.getElementById('letter-content').innerHTML;
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Document Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #000; }
        h3 { color: #333; margin-top: 30px; }
        .letter-list { list-style: none; padding: 0; }
        .letter-list li { padding: 10px; margin: 5px 0; border-left: 3px solid #ccc; background: #f5f5f5; }
        .letter-list li.difference { background: #fff3cd; border-color: #ffc107; }
        .letter-list li.missing { background: #f8d7da; border-color: #dc3545; }
        .letter-list li.coverage-increase { background: #d4edda; border-color: #28a745; }
        .letter-list li.coverage-restriction { background: #f8d7da; border-color: #dc3545; }
    </style>
</head>
<body>
    ${content}
</body>
</html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison_report_${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportData() {
    const exportData = {
        comparison: comparisonData,
        editHistory: editHistory,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison_data_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function closeLetterModal() {
    document.getElementById('letter-modal').style.display = 'none';
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
function normalizeValue(value) {
    if (!value) return '';
    return value.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSection(sectionId) {
    document.getElementById(sectionId).style.display = 'block';
}

function hideSection(sectionId) {
    document.getElementById(sectionId).style.display = 'none';
}