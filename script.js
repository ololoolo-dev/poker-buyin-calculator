let playerData = [];
let gameStarted = false;
let buyInAmount = 0;
let chipsPerBuyIn = 0;
const CURRENT_GAME_KEY = 'currentPokerGame';

function startGame() {
    console.log("startGame called"); // Debug log
    // Get and validate input values
    const buyInInput = parseInt(document.getElementById('buyInAmount').value) || 0;
    const chipsInput = parseInt(document.getElementById('chipsPerBuyIn').value) || 0;

    // Check for valid inputs
    if (buyInInput <= 0 || chipsInput <= 0) {
        alert('Please enter valid values greater than 0 for Buy-in Amount and Chips per Buy-in.');
        return;
    }

    // Set global variables
    buyInAmount = buyInInput;
    chipsPerBuyIn = chipsInput;

    // Confirm with user
    if (!confirm(`Start game with Buy-in: $${buyInAmount} = ${chipsPerBuyIn} chips?`)) {
        return;
    }

    // Initialize game state
    if (!gameStarted) {
        playerData = JSON.parse(localStorage.getItem(CURRENT_GAME_KEY)) || [];
        gameStarted = true;
    }

    // Update UI
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    updatePlayerTable();
}

function addPlayer() {
    // Ensure the table has an empty row for adding a new player
    updatePlayerTable();
    const tbody = document.getElementById('playerTableBody');
    const lastRow = tbody.lastElementChild;
    const nameInput = lastRow.querySelector('.player-name');
    nameInput.focus(); // Focus on the name input for immediate entry
}

function updatePlayerTable() {
    const tbody = document.getElementById('playerTableBody');
    tbody.innerHTML = '';

    // Add existing players
    playerData.forEach((player, index) => {
        const totalChipsTaken = player.buyIns * chipsPerBuyIn;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>
                <select class="buy-ins" onchange="updateBuyInsFromTable(this, ${index})">
                    ${[...Array(10).keys()].map(i => `<option value="${i + 1}" ${player.buyIns === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}
                </select>
            </td>
            <td class="total-chips">${totalChipsTaken}</td>
        `;
        tbody.appendChild(row);
    });

    // Add one empty row for new player
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td><input type="text" class="player-name" placeholder="Enter player name" onblur="savePlayerData(this)" maxlength="10"></td>
        <td>
            <select class="buy-ins" onchange="savePlayerData(this)">
                ${[...Array(10).keys()].map(i => `<option value="${i + 1}">${i + 1}</option>`).join('')}
            </select>
        </td>
        <td class="total-chips">0</td>
    `;
    tbody.appendChild(emptyRow);
}

function savePlayerData(element) {
    const row = element.closest('tr');
    const nameInput = row.querySelector('.player-name');
    const buyInsSelect = row.querySelector('.buy-ins');
    const playerName = nameInput.value.trim();
    const buyIns = parseInt(buyInsSelect.value);

    // Validation
    if (!playerName) {
        return; // Do not save if name is empty
    }
    if (playerName.length > 10) {
        alert('Player name must not exceed 10 characters.');
        nameInput.value = playerName.slice(0, 10); // Truncate to 10 chars
        return;
    }
    if (playerData.some(player => player.name.toLowerCase() === playerName.toLowerCase())) {
        alert('Duplicate player name is not allowed.');
        nameInput.value = ''; // Clear the input
        return;
    }

    // Check if this is a new player (empty row)
    if (row.querySelector('.player-name')) {
        playerData.push({
            name: playerName,
            buyIns: buyIns,
            chips: 0
        });
        autoSave();
        updatePlayerTable();
    }
}

function updateBuyInsFromTable(select, index) {
    playerData[index].buyIns = parseInt(select.value);
    autoSave();
    updateChipDisplay(index); // Update the Chips Taken display dynamically
}

function updateBuyIns(index, buyIns) {
    playerData[index].buyIns = parseInt(buyIns);
    autoSave();
    updateChipDisplay(index); // Update the Chips Taken display dynamically
}

function updateChipDisplay(index) {
    const tbody = document.getElementById('playerTableBody');
    const row = tbody.children[index];
    const totalChipsTaken = playerData[index].buyIns * chipsPerBuyIn;
    
    // Check if we're in chip entry mode (after End Game)
    if (row.cells[1].querySelector('select')) {
        // Update the Chips Taken column (third column)
        const chipsTakenCell = row.cells[2];
        chipsTakenCell.textContent = totalChipsTaken;
    } else {
        // Initial phase: update the Chips Taken column directly
        updatePlayerTable();
    }
}

function autoSave() {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(playerData));
}

function endGame() {
    // Confirmation popup
    if (!confirm('Are you sure you want to end the game and enter chip counts?')) {
        return;
    }

    // Convert table to chip entry mode
    const tbody = document.getElementById('playerTableBody');
    tbody.innerHTML = '';
    playerData.forEach((player, index) => {
        const totalChipsTaken = player.buyIns * chipsPerBuyIn;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>
                <select class="buy-ins" onchange="updateBuyIns(${index}, this.value)">
                    ${[...Array(10).keys()].map(i => `<option value="${i + 1}" ${player.buyIns === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}
                </select>
            </td>
            <td class="total-chips">${totalChipsTaken}</td>
            <td><input type="number" min="0" value="${player.chips || 0}" onchange="updateChips(${index}, this.value)"></td>
        `;
        tbody.appendChild(row);
    });

    // Update table headers to include "Chips (Cashed)"
    const thead = document.querySelector('#playerTable thead tr');
    thead.innerHTML = `
        <th>Player</th>
        <th>Buy-ins</th>
        <th>Chips Taken</th>
        <th>Chips (Cashed)</th>
    `;

    const endButton = document.querySelector('#gameArea .end');
    endButton.textContent = 'Calculate Results';
    endButton.onclick = calculateResults;

    // Hide the Add Player button to prevent further additions
    document.querySelector('#gameArea .add').classList.add('hidden');
}

function updateChips(index, chips) {
    playerData[index].chips = parseInt(chips) || 0;
    autoSave();
}

function calculateResults() {
    let totalPool = 0;
    let totalChipsTaken = 0;
    playerData.forEach(player => {
        totalPool += player.buyIns * buyInAmount;
        totalChipsTaken += player.buyIns * chipsPerBuyIn;
    });

    const totalChipsCashedIn = playerData.reduce((sum, p) => sum + (p.chips || 0), 0);
    const chipValue = totalPool / (totalChipsCashedIn || 1);
    const chipDifference = totalChipsCashedIn - totalChipsTaken;

    let resultsHTML = `
        <table>
            <tr>
                <th>Player</th>
                <th>Buy-ins</th>
                <th>Chips Taken</th>
                <th>Chips (Cashed)</th>
                <th>Net ($)</th>
            </tr>
    `;

    let suspiciousPlayers = [];
    if (totalChipsCashedIn !== totalChipsTaken) {
        playerData.forEach(player => {
            const expectedChips = player.buyIns * chipsPerBuyIn;
            const chipDiff = Math.abs((player.chips || 0) - expectedChips);
            if (chipDiff > totalChipsTaken * 0.2) {
                suspiciousPlayers.push(player.name);
            }
        });
    }

    const profitLossData = [];
    playerData.forEach(player => {
        const totalChipsTaken = player.buyIns * chipsPerBuyIn;
        const amountWon = (player.chips || 0) * chipValue;
        const amountPaid = player.buyIns * buyInAmount;
        const difference = amountWon - amountPaid;
        const isSuspicious = suspiciousPlayers.includes(player.name);
        
        resultsHTML += `
            <tr ${isSuspicious ? 'class="suspicious"' : ''}>
                <td style="color: #00C853;">${player.name}</td>
                <td>${player.buyIns}</td>
                <td>${totalChipsTaken}</td>
                <td>${player.chips || 0}</td>
                <td>$${difference.toFixed(2)} ${difference >= 0 ? '(+)' : '(-)'}</td>
            </tr>
        `;
        profitLossData.push({ name: player.name, value: difference });
    });

    if (totalChipsCashedIn !== totalChipsTaken) {
        const dongaAmount = chipDifference * chipValue;
        resultsHTML += `
            <tr class="donga">
                <td style="color: #00C853;">DONGA (Difference)</td>
                <td>0</td>
                <td>0</td>
                <td>${chipDifference > 0 ? '+' : ''}${chipDifference}</td>
                <td>$${dongaAmount.toFixed(2)}</td>
            </tr>
        `;
    }

    resultsHTML += '</table>';

    if (totalChipsCashedIn !== totalChipsTaken) {
        resultsHTML = `
            <div class="warning">
                ⚠️ Chip mismatch! Taken: ${totalChipsTaken}, Cashed in: ${totalChipsCashedIn}, Difference: ${chipDifference > 0 ? '+' : ''}${chipDifference}
                ${suspiciousPlayers.length > 0 ? '(Check: ' + suspiciousPlayers.join(', ') + ')' : ''}
            </div>
        ` + resultsHTML;
    } else {
        resultsHTML = `
            <div class="info">
                ✅ Chips balanced: ${totalChipsTaken}
            </div>
        ` + resultsHTML;
    }

    document.getElementById('resultsTable').innerHTML = resultsHTML;
    document.getElementById('totalPool').textContent = totalPool.toFixed(2);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('gameArea').classList.add('hidden');
    localStorage.removeItem(CURRENT_GAME_KEY);
}

function resetApp() {
    playerData = [];
    gameStarted = false;
    buyInAmount = 0;
    chipsPerBuyIn = 0;
    localStorage.removeItem(CURRENT_GAME_KEY);
    document.getElementById('playerInputs').classList.remove('hidden');

    // Reset table headers to initial state
    const thead = document.querySelector('#playerTable thead tr');
    thead.innerHTML = `
        <th>Player</th>
        <th>Buy-ins</th>
        <th>Chips Taken</th>
    `;

    updatePlayerTable();
    document.getElementById('results').classList.add('hidden');
    document.getElementById('gameArea').classList.add('hidden');
    document.getElementById('setup').classList.remove('hidden');
    const endButton = document.querySelector('#gameArea .end');
    if (endButton) {
        endButton.textContent = 'End Game';
        endButton.onclick = endGame;
        document.querySelector('#gameArea .add').classList.remove('hidden');
    }
}

window.onload = () => {
    document.getElementById('setup').classList.remove('hidden');
    updatePlayerTable();
};