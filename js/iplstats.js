google.charts.load('current', { packages: ['corechart'] });

baseUrl = 'https://ipl-stats-be.onrender.com/'
async function getPlayers(teamId) {
    try {
        const response = await fetch(`${baseUrl}v1/stats/players/${teamId}`);
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
        const teamDetails = await fetch(`${baseUrl}v1/stats/team-basic-details`).then(response => response.json());
        return teamDetails.data; // Use Set to remove duplicates
    } catch (error) {
        console.error("Error fetching teams data:", error);
        return [];
    }
}

async function getPlayersByTeam(teamId, teamLabel) {
    try {
        const response = await getPlayers(teamId);
        return response.data;
    } catch (error) {
        console.error("Error fetching players data:", error);
        return [];
    }
}

async function renderTeamButtons() {
    const teams = await getTeams();
    console.log(teams);
    const idShowTeamNames = document.getElementById("idShowTeamNames");
    if (!idShowTeamNames) return console.error("Element not found!");
    idShowTeamNames.innerHTML = teams
        .map(team => `<button class="btn btn-primary mx-2 mt-2" onclick="showPlayersOf('${team.teamId}','${team.teamLabel}')">${team.teamLabel}</button>`)
        .join('');

    showPlayersOf(teams[0].teamId, teams[0].teamLabel);
}

async function showPlayersOf(teamId) {
    const players = await getPlayersByTeam(teamId);
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
                        <td>${player.teamLabel}</td>
                        <td>${player.price}</td>
                    </tr>`).join('')}
            </tbody>
        </table>
    `;
}

async function getIplStats() {
    const stats = await fetch(`${baseUrl}v1/stats/team-stats`).then(response => response.json()).then(data => data.data);
    arr = stats.teamAmountStats;
    stats.teamAmount = new Map(arr.map(i => [i.label, i.totalAmount]));
    arr = stats.teamPlayerCountStats;
    stats.roleCount = new Map(arr.map(i => [i.label, i.roleCount]));
    arr = stats.countryNameWithPlayerCountStats;
    stats.countryPlayerCount = new Map(arr.map(i => [i.countryName, i.playerCount]));
    showIplStatsCharts(stats);
}

function showIplStatsCharts(stats) {
    drawChart('idTeamAmount', 'Total Amount Spent by Team', stats.teamAmount, 'ColumnChart',['Team','Amount']);
    drawChart('idRoleCount', 'Role Count', stats.roleCount, 'PieChart',['Role','Count']);
    drawChart('idCountryPlayerCount', 'Players by Country', stats.countryPlayerCount, 'BarChart',['Country','Player Count']);
}

function drawChart(elementId, title, dataMap, chartType,label) {
    let inputData = []
    inputData.push(label);
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
