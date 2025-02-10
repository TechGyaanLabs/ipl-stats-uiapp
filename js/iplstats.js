google.charts.load('current', { packages: ['corechart'] });

let cachedPlayers = null; // Store player data globally to prevent redundant API calls

async function getPlayers() {
    if (cachedPlayers) return cachedPlayers;

    try {
        const response = await fetch('js/players.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        cachedPlayers = await response.json();
        return cachedPlayers;
    } catch (error) {
        console.error("Error fetching players data:", error);
        return [];
    }
}

async function getTeams() {
    try {
        const players = await getPlayers();
        return [...new Set(players.map(player => player.team))]; // Use Set to remove duplicates
    } catch (error) {
        console.error("Error fetching teams data:", error);
        return [];
    }
}

async function getPlayersByTeam(teamName) {
    try {
        const players = await getPlayers();
        return players.filter(player => player.team === teamName);
    } catch (error) {
        console.error("Error fetching players data:", error);
        return [];
    }
}

async function renderTeamButtons() {
    const teams = await getTeams();
    const idShowTeamNames = document.getElementById("idShowTeamNames");

    if (!idShowTeamNames) return console.error("Element not found!");

    idShowTeamNames.innerHTML = teams
        .map(team => `<button class="btn btn-primary mx-2 mt-2" onclick="showPlayersOf('${team}')">${team}</button>`)
        .join('');
}

async function showPlayersOf(teamName) {
    const players = await getPlayersByTeam(teamName);
    const idShowPlayers = document.getElementById("idShowPlayers");

    if (!idShowPlayers) return console.error("Element not found!");

    idShowPlayers.innerHTML = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Country</th>
                    <th>Team</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(player => `
                    <tr>
                        <td>${player.name}</td>
                        <td>${player.role}</td>
                        <td>${player.country}</td>
                        <td>${player.team}</td>
                        <td>${player.price}</td>
                    </tr>`).join('')}
            </tbody>
        </table>
    `;
}

async function getIplStats() {
    const players = await getPlayers();

    const stats = players.reduce((acc, player) => {
        acc.teamAmount.set(player.team, (acc.teamAmount.get(player.team) || 0) + player.price);
        acc.roleCount.set(player.role, (acc.roleCount.get(player.role) || 0) + 1);
        acc.countryPlayerCount.set(player.country, (acc.countryPlayerCount.get(player.country) || 0) + 1);
        return acc;
    }, { teamAmount: new Map(), roleCount: new Map(), countryPlayerCount: new Map() });

    showIplStatsCharts(stats);
}

function showIplStatsCharts(stats) {
    drawChart('idTeamAmount', 'Total Amount Spent by Team', stats.teamAmount, 'ColumnChart');
    drawChart('idRoleCount', 'Role Count', stats.roleCount, 'PieChart');
    drawChart('idCountryPlayerCount', 'Players by Country', stats.countryPlayerCount, 'BarChart');
}

function drawChart(elementId, title, dataMap, chartType) {
    let inputData = [[...dataMap.keys()][0] === 'Team' ? ['Team', 'Amount'] : ['Category', 'Count']];
    
    for (let [key, value] of dataMap) {
        inputData.push([key, value]);
    }

    google.charts.setOnLoadCallback(() => {
        var data = google.visualization.arrayToDataTable(inputData);
        var options = { title, width: 400, height: 300 };
        var chart = new google.visualization[chartType](document.getElementById(elementId));
        chart.draw(data, options);
    });
}

// Initialize the app
renderTeamButtons();
getIplStats();
