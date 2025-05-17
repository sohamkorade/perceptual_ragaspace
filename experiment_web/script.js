let tanpuraOn = false;
const tanpura1 = new Audio("C_tanpura.mp3");
const tanpura2 = new Audio("C_tanpura.mp3");

let playingRaga;

// const gridCells = {
//   cell1: ["ragaA1", "ragaA2"],
//   cell2: ["ragaB1", "ragaB2"],
//   cell3: ["ragaC1", "ragaC2"],
//   cell4: ["ragaD1", "ragaD2"],
//   cell5: ["ragaE1", "ragaE2"],
//   cell6: ["ragaF1", "ragaF2"],
//   cell7: ["ragaG1", "ragaG2"],
//   cell8: ["ragaH1", "ragaH2"],
//   cell9: ["ragaI1", "ragaI2"]
// };

let gridCells;

fetch("raga_sets.json")
	.then(response => response.json())
	.then(data => {
		gridCells = data;
		console.log("Grid cells loaded:", gridCells);
	})
	.catch(error => {
		console.error("Error loading grid cells:", error);
	});

let ragaDB;

fetch("db.json")
	.then(response => response.json())
	.then(data => {
		ragaDB = data;
		console.log("Raga database loaded:", ragaDB);
	})
	.catch(error => {
		console.error("Error loading raga database:", error);
	});

let selectedRagas = {}; // cell → ragaName
let trials = [];        // list of {cell1, cell2, raga1, raga2}
let currentTrialIndex = 0;
let responses = [];
let endResponses = {};

function getRandom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateTrials() {
	const cells = Object.keys(gridCells);
	// Select 1 raga per cell
	cells.forEach(cell => {
		const filtered = gridCells[cell].filter(raga => {
			// filter out ragas based on preference
			if (preference == "hindustani") {
				return raga.includes("H_");
			} else if (preference == "carnatic") {
				return raga.includes("C_");
			} else if (preference == "both") {
				return raga.includes("H_") || raga.includes("C_");
			}
			return false;
		});
		selectedRagas[cell] = getRandom(filtered);
	});

	console.log("Selected ragas:", selectedRagas);

	// Generate 9C2 pairs
	for (let i = 0; i < cells.length; i++) {
		for (let j = i + 1; j < cells.length; j++) {
			trials.push({
				cell1: cells[i],
				cell2: cells[j],
				raga1: selectedRagas[cells[i]],
				raga2: selectedRagas[cells[j]],
				raga1TimesPlayed: 0,
				raga2TimesPlayed: 0,
			});
		}
	}

	// Shuffle trials
	trials = trials.sort(() => Math.random() - 0.5);

	// shuffle raga1 and raga2 within each trial
	trials.forEach(trial => {
		if (Math.random() < 0.5) {
			const temp = trial.raga1;
			trial.raga1 = trial.raga2;
			trial.raga2 = temp;
		}
	})

	console.log("Trials generated:", trials);
}

function showTrial() {
	// hide and fade-in the current trial
	const trialDiv = document.getElementById('trial');
	trialDiv.classList.add('hidden');
	setTimeout(() => {
		trialDiv.classList.remove('hidden');
	}, 500);

	if (currentTrialIndex >= trials.length) {
		document.getElementById('experiment').classList.add('hidden');
		document.getElementById('end-questions').classList.remove('hidden');
		return;
	}

	const trial = trials[currentTrialIndex];
	currentTrial = trial;
	document.getElementById('trial-count').innerText =
		`Trial ${currentTrialIndex + 1} of ${trials.length}`;
	// document.getElementById('raga-pair').innerText =
	//   `${trial.raga1} vs ${trial.raga2}`;
}

function saveResponse(rating) {
	const trial = trials[currentTrialIndex];
	responses.push({
		trialIndex: currentTrialIndex + 1,
		raga1: trial.raga1,
		raga2: trial.raga2,
		cell1: trial.cell1,
		cell2: trial.cell2,
		rating: rating,
		timestamp: new Date().toISOString()
	});
	currentTrialIndex++;
	showTrial();
}

// Populate rating buttons
const ratingContainer = document.getElementById('rating-buttons');
const redToGreenGradient = [
	"#FF0000", // red
	"#CC3300",
	"#996600",
	"#669900",
	"#33CC00",
	"#00FF00", // green
	"#00CC00"
  ];  

for (let i = 1; i <= 7; i++) {
	const btn = document.createElement('button');
	btn.innerText = i;
	btn.style.backgroundColor = redToGreenGradient[i - 1];
	btn.style.color = "white";
	btn.style.border = "1px solid black";
	btn.onclick = () => saveResponse(i);
	ratingContainer.appendChild(btn);
}

// Start experiment
document.getElementById('start-btn').onclick = () => {
	const pid = document.getElementById('participant-id').value.trim();
	if (!pid) {
		alert("Please enter Participant ID.");
		return;
	}
	participantID = pid;
	experiment_url = window.location.href;
	preference = document.getElementById('preference').value;
	startExperiment();
};

// Submit end-questions
document.getElementById('submit-btn').onclick = () => {
	// collect all elements with class "end-question"
	const endQuestions = document.querySelectorAll('.end-question');
	endResponses = {};
	endQuestions.forEach(q => {
		endResponses[q.id] = q.value;
	});

	// hide end questions and show download button
	document.getElementById('end-questions').classList.add('hidden');
	document.getElementById('end-screen').classList.remove('hidden');
}

function startExperiment() {
	generateTrials();
	document.getElementById('intro').classList.add('hidden');
	document.getElementById('experiment').classList.remove('hidden');
	showTrial();
}

// Download data
document.getElementById('download-btn').onclick = () => {
	const blob = new Blob([JSON.stringify({
		participant_id: participantID,
		experiment_url: experiment_url,
		date: new Date().toISOString(),
		selected_ragas: selectedRagas,
		responses: responses,
		end_responses: endResponses,
	}, null, 2)], { type: "application/json" });

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `raga_responses_${participantID}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

function play_raga(ragaName) {
	const SEQ_SIZE = 16;
	// get a random subsequence of SEQ_SIZE from the raga
	const seq = ragaDB[ragaName];
	const start = Math.floor(Math.random() * (seq.length - SEQ_SIZE));
	const end = start + SEQ_SIZE;
	const subseq = seq.slice(start, end);

	if (playingRaga) {
		playingRaga.stop();
	}

	playingRaga = notationToAudioRealtime(subseq, () => {
		document.getElementById('audio-info').innerText = "";
	})
	// alert(`Playing seq: ${subseq}`);
	document.getElementById('audio-info').innerText = `Playing...`;

	if (ragaName == currentTrial.raga1) {
		currentTrial.raga1TimesPlayed++;
	} else if (ragaName == currentTrial.raga2) {
		currentTrial.raga2TimesPlayed++;
	}
}

function toggleTanpura() {
	if (tanpuraOn) {
		document.getElementById('play-tanpura').innerText = "Play Tanpura";
	} else {
		document.getElementById('play-tanpura').innerText = "Stop Tanpura";
	}
	tanpuraOn = !tanpuraOn;

	if (tanpuraOn) {
		tanpura1.loop = true;
		tanpura1.volume = 0.1;
		tanpura1.play();
		// stagger the start of the second tanpura
		tanpura2.currentTime = 0.5;
		tanpura2.loop = true;
		tanpura2.volume = 0.1;
		tanpura2.play();
	} else {
		tanpura1.pause();
		tanpura2.pause();
		tanpura1.currentTime = 0;
		tanpura2.currentTime = 0;
	}
}