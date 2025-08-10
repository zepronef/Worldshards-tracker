// WorldShards Tracking Application
class WorldShardsTracker {
    constructor() {
        this.data = this.loadData();
        this.currentTab = 'saisie';
        this.initializeEventListeners();
        this.updateAllDisplays();
    }

    // Utility function to format large numbers with spaces
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Data Management
    loadData() {
        const saved = localStorage.getItem('worldshards-data');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading data:', e);
                return [];
            }
        }
        return [];
    }

    saveData() {
        try {
            localStorage.setItem('worldshards-data', JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    addEntry(entry) {
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            mapSize: entry.mapSize,
            luck: parseInt(entry.luck),
            charges: parseInt(entry.charges),
            tokens: parseInt(entry.tokens),
            tokensPerCharge: parseFloat((entry.tokens / entry.charges).toFixed(2))
        };
        
        this.data.unshift(newEntry);
        this.saveData();
        this.updateAllDisplays();
        this.showSuccessMessage();
        this.resetForm();
    }

    deleteEntry(id) {
        this.data = this.data.filter(entry => entry.id !== id);
        this.saveData();
        this.updateAllDisplays();
    }

    resetForm() {
        document.getElementById('dataForm').reset();
    }

    // Calculate dynamic luck ranges based on data
    calculateLuckRanges() {
        if (this.data.length === 0) return [];

        const luckValues = this.data.map(entry => entry.luck);
        const maxLuck = Math.max(...luckValues);
        
        let ranges;
        if (maxLuck < 1000) {
            ranges = [
                { min: 0, max: 250, label: '0 - 250' },
                { min: 251, max: 500, label: '251 - 500' },
                { min: 501, max: 750, label: '501 - 750' },
                { min: 751, max: Infinity, label: '751+' }
            ];
        } else if (maxLuck < 10000) {
            ranges = [
                { min: 0, max: 2500, label: '0 - 2 500' },
                { min: 2501, max: 5000, label: '2 501 - 5 000' },
                { min: 5001, max: 7500, label: '5 001 - 7 500' },
                { min: 7501, max: Infinity, label: '7 501+' }
            ];
        } else {
            ranges = [
                { min: 0, max: 25000, label: '0 - 25 000' },
                { min: 25001, max: 50000, label: '25 001 - 50 000' },
                { min: 50001, max: 75000, label: '50 001 - 75 000' },
                { min: 75001, max: Infinity, label: '75 001+' }
            ];
        }

        return ranges;
    }

    // Event Listeners
    initializeEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Data Form
        const form = document.getElementById('dataForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // Export Button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportToCSV();
            });
        }

        // Prediction Calculator
        const calcBtn = document.getElementById('calculatePrediction');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => {
                this.calculatePrediction();
            });
        }

        // Real-time prediction updates
        ['predLuck', 'predCharges', 'predMapSize'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.updatePredictionPreview();
                });
            }
        });
    }

    // Tab Management
    switchTab(tabName) {
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.updateDisplaysForCurrentTab();
    }

    // Form Handling
    handleFormSubmit() {
        const form = document.getElementById('dataForm');
        const formData = new FormData(form);
        
        const entry = {
            mapSize: formData.get('mapSize') || document.getElementById('mapSize').value,
            luck: document.getElementById('luck').value,
            charges: document.getElementById('charges').value,
            tokens: document.getElementById('tokens').value
        };

        // Validation
        if (!entry.mapSize || !entry.luck || !entry.charges || !entry.tokens) {
            alert('Veuillez remplir tous les champs.');
            return;
        }

        if (parseInt(entry.luck) < 0 || parseInt(entry.charges) < 1 || parseInt(entry.tokens) < 0) {
            alert('Veuillez saisir des valeurs valides.');
            return;
        }

        this.addEntry(entry);
    }

    // Display Updates
    updateAllDisplays() {
        this.updateHistoryTable();
        this.updateStatistics();
        this.updateAnalysis();
        this.updateOptimizationTips();
    }

    updateDisplaysForCurrentTab() {
        switch (this.currentTab) {
            case 'saisie':
                this.updateHistoryTable();
                break;
            case 'statistiques':
                this.updateStatistics();
                break;
            case 'analyse':
                this.updateAnalysis();
                this.updateOptimizationTips();
                break;
        }
    }

    updateHistoryTable() {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        if (this.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">Aucune donnée</div>
                        <div class="empty-state-hint">Ajoutez votre première entrée ci-dessus</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.map(entry => `
            <tr class="fade-in">
                <td>${new Date(entry.timestamp).toLocaleString('fr-FR')}</td>
                <td><span class="font-mono">${entry.mapSize}</span></td>
                <td><span class="font-mono">${this.formatNumber(entry.luck)}</span></td>
                <td>${entry.charges}</td>
                <td>${entry.tokens}</td>
                <td><strong>${entry.tokensPerCharge.toFixed(2)}</strong></td>
                <td>
                    <button class="btn btn-danger" onclick="tracker.deleteEntry(${entry.id})" title="Supprimer">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateStatistics() {
        if (this.data.length === 0) {
            document.getElementById('totalRuns').textContent = '0';
            document.getElementById('totalTokens').textContent = '0';
            document.getElementById('totalCharges').textContent = '0';
            document.getElementById('avgRatio').textContent = '0';
            document.getElementById('minLuck').textContent = '-';
            document.getElementById('maxLuck').textContent = '-';
            document.getElementById('avgLuck').textContent = '-';
            document.getElementById('mapStatsTableBody').innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="empty-state-text">Aucune donnée disponible</div>
                    </td>
                </tr>
            `;
            return;
        }

        // General stats
        const totalRuns = this.data.length;
        const totalTokens = this.data.reduce((sum, entry) => sum + entry.tokens, 0);
        const totalCharges = this.data.reduce((sum, entry) => sum + entry.charges, 0);
        const avgRatio = totalCharges > 0 ? (totalTokens / totalCharges).toFixed(2) : 0;

        document.getElementById('totalRuns').textContent = this.formatNumber(totalRuns);
        document.getElementById('totalTokens').textContent = this.formatNumber(totalTokens);
        document.getElementById('totalCharges').textContent = this.formatNumber(totalCharges);
        document.getElementById('avgRatio').textContent = avgRatio;

        // Luck stats
        const luckValues = this.data.map(entry => entry.luck);
        const minLuck = Math.min(...luckValues);
        const maxLuck = Math.max(...luckValues);
        const avgLuck = Math.round(luckValues.reduce((sum, luck) => sum + luck, 0) / luckValues.length);

        document.getElementById('minLuck').textContent = this.formatNumber(minLuck);
        document.getElementById('maxLuck').textContent = this.formatNumber(maxLuck);
        document.getElementById('avgLuck').textContent = this.formatNumber(avgLuck);

        // Map size stats
        this.updateMapSizeStats();
    }

    updateMapSizeStats() {
        const mapSizes = ['Petite', 'Moyenne', 'Grande', 'Très Grande'];
        const tbody = document.getElementById('mapStatsTableBody');
        if (!tbody) return;

        const mapStats = mapSizes.map(size => {
            const entries = this.data.filter(entry => entry.mapSize === size);
            if (entries.length === 0) {
                return {
                    size,
                    count: 0,
                    avgTokens: 0,
                    avgCharges: 0,
                    avgRatio: 0
                };
            }

            const totalTokens = entries.reduce((sum, entry) => sum + entry.tokens, 0);
            const totalCharges = entries.reduce((sum, entry) => sum + entry.charges, 0);

            return {
                size,
                count: entries.length,
                avgTokens: Math.round(totalTokens / entries.length),
                avgCharges: Math.round(totalCharges / entries.length),
                avgRatio: totalCharges > 0 ? (totalTokens / totalCharges).toFixed(2) : 0
            };
        });

        tbody.innerHTML = mapStats.map(stat => `
            <tr>
                <td><strong>${stat.size}</strong></td>
                <td>${stat.count}</td>
                <td>${this.formatNumber(stat.avgTokens)}</td>
                <td>${stat.avgCharges}</td>
                <td><strong>${stat.avgRatio}</strong></td>
            </tr>
        `).join('');
    }

    updateAnalysis() {
        this.updateLuckRangesAnalysis();
    }

    updateLuckRangesAnalysis() {
        const tbody = document.getElementById('luckRangesTableBody');
        if (!tbody) return;

        if (this.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="empty-state-text">Aucune donnée pour l'analyse</div>
                    </td>
                </tr>
            `;
            return;
        }

        const ranges = this.calculateLuckRanges();
        const rangeStats = ranges.map(range => {
            const entries = this.data.filter(entry => 
                entry.luck >= range.min && 
                (range.max === Infinity ? true : entry.luck <= range.max)
            );

            if (entries.length === 0) {
                return {
                    label: range.label,
                    count: 0,
                    avgTokens: 0,
                    avgRatio: 0
                };
            }

            const totalTokens = entries.reduce((sum, entry) => sum + entry.tokens, 0);
            const totalCharges = entries.reduce((sum, entry) => sum + entry.charges, 0);

            return {
                label: range.label,
                count: entries.length,
                avgTokens: Math.round(totalTokens / entries.length),
                avgRatio: totalCharges > 0 ? (totalTokens / totalCharges).toFixed(2) : 0
            };
        });

        tbody.innerHTML = rangeStats.map(stat => `
            <tr>
                <td><strong>${stat.label}</strong></td>
                <td>${stat.count}</td>
                <td>${this.formatNumber(stat.avgTokens)}</td>
                <td><strong>${stat.avgRatio}</strong></td>
            </tr>
        `).join('');
    }

    updateOptimizationTips() {
        const container = document.getElementById('optimizationTips');
        if (!container || this.data.length === 0) {
            if (container) {
                container.innerHTML = '<p>Ajoutez des données pour recevoir des conseils d\'optimisation personnalisés.</p>';
            }
            return;
        }

        const tips = this.generateOptimizationTips();
        container.innerHTML = `
            <h3>Conseils Personnalisés</h3>
            <ul>
                ${tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        `;
    }

    generateOptimizationTips() {
        const tips = [];

        // Best map size analysis
        const mapSizes = ['Petite', 'Moyenne', 'Grande', 'Très Grande'];
        let bestMapSize = null;
        let bestRatio = 0;

        mapSizes.forEach(size => {
            const entries = this.data.filter(entry => entry.mapSize === size);
            if (entries.length > 0) {
                const totalTokens = entries.reduce((sum, entry) => sum + entry.tokens, 0);
                const totalCharges = entries.reduce((sum, entry) => sum + entry.charges, 0);
                const ratio = totalTokens / totalCharges;
                
                if (ratio > bestRatio) {
                    bestRatio = ratio;
                    bestMapSize = size;
                }
            }
        });

        if (bestMapSize) {
            tips.push(`Les maps "${bestMapSize}" offrent votre meilleur ratio tokens/charge (${bestRatio.toFixed(2)})`);
        }

        // Luck analysis
        const luckValues = this.data.map(entry => entry.luck);
        const avgLuck = luckValues.reduce((sum, luck) => sum + luck, 0) / luckValues.length;
        const highLuckEntries = this.data.filter(entry => entry.luck > avgLuck);
        
        if (highLuckEntries.length > 0) {
            const highLuckAvgRatio = highLuckEntries.reduce((sum, entry) => sum + entry.tokensPerCharge, 0) / highLuckEntries.length;
            const lowLuckEntries = this.data.filter(entry => entry.luck <= avgLuck);
            const lowLuckAvgRatio = lowLuckEntries.reduce((sum, entry) => sum + entry.tokensPerCharge, 0) / lowLuckEntries.length;
            
            if (highLuckAvgRatio > lowLuckAvgRatio) {
                tips.push(`Une Luck élevée (>${this.formatNumber(Math.round(avgLuck))}) améliore votre rendement de ${((highLuckAvgRatio/lowLuckAvgRatio - 1) * 100).toFixed(1)}%`);
            }
        }

        // Efficiency tip
        const avgRatio = this.data.reduce((sum, entry) => sum + entry.tokensPerCharge, 0) / this.data.length;
        tips.push(`Votre ratio moyen est de ${avgRatio.toFixed(2)} tokens/charge`);

        // Data quantity tip
        if (this.data.length < 10) {
            tips.push('Ajoutez plus de données pour des analyses plus précises');
        }

        return tips;
    }

    // Prediction Calculator
    calculatePrediction() {
        const luck = parseInt(document.getElementById('predLuck').value);
        const charges = parseInt(document.getElementById('predCharges').value);
        const mapSize = document.getElementById('predMapSize').value;

        if (!luck || !charges || !mapSize) {
            alert('Veuillez remplir tous les champs du prédicteur.');
            return;
        }

        const prediction = this.predictTokens(luck, charges, mapSize);
        this.displayPrediction(prediction);
    }

    predictTokens(luck, charges, mapSize) {
        // If no data, use basic estimation
        if (this.data.length === 0) {
            return {
                estimated: charges * 5, // Basic estimation
                confidence: 'Faible (aucune donnée historique)',
                based_on: 'Estimation générale'
            };
        }

        // Find similar entries (same map size)
        const similarEntries = this.data.filter(entry => entry.mapSize === mapSize);
        
        if (similarEntries.length === 0) {
            // Use overall average
            const avgRatio = this.data.reduce((sum, entry) => sum + entry.tokensPerCharge, 0) / this.data.length;
            return {
                estimated: Math.round(charges * avgRatio),
                confidence: 'Moyenne (données générales)',
                based_on: `Ratio moyen global: ${avgRatio.toFixed(2)}`
            };
        }

        // Calculate weighted average based on luck similarity
        let totalWeight = 0;
        let weightedRatio = 0;

        similarEntries.forEach(entry => {
            const luckDiff = Math.abs(entry.luck - luck);
            const weight = 1 / (1 + luckDiff / 10000); // Weight decreases with luck difference
            weightedRatio += entry.tokensPerCharge * weight;
            totalWeight += weight;
        });

        const predictedRatio = weightedRatio / totalWeight;
        const estimated = Math.round(charges * predictedRatio);

        return {
            estimated,
            confidence: similarEntries.length >= 3 ? 'Élevée' : 'Moyenne',
            based_on: `${similarEntries.length} entrées similaires (${mapSize})`
        };
    }

    displayPrediction(prediction) {
        const container = document.getElementById('predictionResult');
        if (!container) return;

        container.innerHTML = `
            <h4>🔮 Prédiction</h4>
            <div class="prediction-value">${this.formatNumber(prediction.estimated)} tokens estimés</div>
            <p><strong>Confiance:</strong> ${prediction.confidence}</p>
            <p><strong>Basé sur:</strong> ${prediction.based_on}</p>
        `;
        container.classList.add('show');
    }

    updatePredictionPreview() {
        // Real-time preview could be implemented here
        // For now, we'll keep it simple with the calculate button
    }

    // Export Functionality
    exportToCSV() {
        if (this.data.length === 0) {
            alert('Aucune donnée à exporter.');
            return;
        }

        const headers = ['Date/Heure', 'Taille Map', 'Luck', 'Charges', 'Tokens', 'Ratio'];
        const rows = this.data.map(entry => [
            new Date(entry.timestamp).toLocaleString('fr-FR'),
            entry.mapSize,
            entry.luck,
            entry.charges,
            entry.tokens,
            entry.tokensPerCharge
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `worldshards-data-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Success Message
    showSuccessMessage() {
        const message = document.getElementById('successMessage');
        if (message) {
            message.classList.add('show');
            setTimeout(() => {
                message.classList.remove('show');
            }, 3000);
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new WorldShardsTracker();
});

// Handle form reset on page reload
window.addEventListener('beforeunload', () => {
    const form = document.getElementById('dataForm');
    if (form) {
        form.reset();
    }
});
