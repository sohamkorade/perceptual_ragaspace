function midiToFrequency(midiNote) {
	return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function clean_notation(notation) {
	// if text is array, convert to string
	if (Array.isArray(notation)) {
		notation = notation.join("")
	}
	// remove comments
	notation = notation.replace(/\/.*\//g, "")

	// remove titles
	notation = notation.replace(/!.*!/g, "")

	// remove bars
	notation = notation.replace(/\|/g, "")

	return notation
}

function adjust_swara(prev_notenum, swara) {
	const notes = "sRrGgmMpDdNn"
	let notenum = notes.indexOf(swara.note) + swara.octave * 12

	// make sure the delta is not too big
	if (prev_notenum == -1) {
		prev_notenum = swara.octave * 12
	}
	// console.log("delta", notenum - prev_notenum)
	const delta = notenum - prev_notenum
	if (delta > 5) {
		notenum -= 12
		swara.octave--
	} else if (delta < -5) {
		notenum += 12
		swara.octave++
	}

	// make sure we have the audio file
	if (notenum < 28) {
		notenum += 12
		swara.octave++
	} else if (notenum > 63) {
		notenum -= 12
		swara.octave--
	}
	return notenum
}

function adjust_swaras(swaras) {
	let prev_notenum = -1
	for (let i = 0; i < swaras.length; i++) {
		// make sure the notes aren't too far apart
		prev_notenum = adjust_swara(prev_notenum, swaras[i])
	}
	return swaras
}

function notation2swaras(notation) {
	const sargam = "sRrGgmMpDdNn"

	// convert text:string to swaras:array
	// * -> rest
	// . -> octave down
	// ' -> octave up
	// () -> double tempo
	// {} -> triple tempo

	notation = clean_notation(notation)

	let swaras = []
	const default_temp_swara = { note: "*", duration: 1, octave: 4 }
	let temp_swara = { note: "*", duration: 1, octave: 4 }
	let temp_beat = []
	let temp_beat_mode = false
	let duration_override = 1
	for (let i = 0; i < notation.length; i++) {
		const c = notation[i]

		// duration override
		if (c == '(') {
			duration_override /= 2
		} else if (c == ')') {
			duration_override *= 2
		} else if (c == '{') {
			duration_override /= 3
		} else if (c == '}') {
			duration_override *= 3
		}

		// beat
		if (c == '[') {
			temp_beat_mode = true
		} else if (c == ']') {
			temp_beat_mode = false
			// insert beat
			const total_duration = temp_beat.reduce((a, b) => a + b.duration, 0)
			temp_beat = temp_beat.map(swara => {
				swara.duration /= total_duration
				return swara
			})
			swaras.push(...temp_beat)
			temp_beat = []
		}

		if (c == '-') {
			// insert a '-' swara, signifying an elongation of the previous swara
			temp_swara.duration = duration_override
			temp_swara.note = "-"
			if (temp_beat_mode) {
				temp_beat.push(temp_swara)
			} else {
				swaras.push(temp_swara)
			}
			temp_swara = Object.assign({}, default_temp_swara)
		}

		if (c == '.') {
			temp_swara.octave--
		} else if (c == "'") {
			temp_swara.octave++
		} else if (sargam.includes(c) || c == '*') {
			temp_swara.duration = duration_override
			temp_swara.note = c
			if (temp_beat_mode) {
				temp_beat.push(temp_swara)
			} else {
				swaras.push(temp_swara)
			}
			temp_swara = Object.assign({}, default_temp_swara)
		} else if (c == '◀' || c == '▶') {
			// swaras.push({ token: c })
		}
	}

	// merge '-'s into previous swara
	let prev_swara_i = -1
	for (let i = 0; i < swaras.length; i++) {
		if (swaras[i].note == "-" /*|| swaras[i].note == "*"*/) { // new: 29aug
			if (prev_swara_i == -1) {
				// convert to rest
				swaras[i].note = "*"
			} else {
				swaras[prev_swara_i].duration += swaras[i].duration
			}
		} else {
			prev_swara_i = i
		}
	}

	// remove all '-'s
	swaras = swaras.filter(s => s.note != "-"/* && s.note != "*"*/) // new: 29aug

	swaras = swaras.reduce((acc, s) => {
		// merge consecutive rests
		if (acc.length > 0 && acc[acc.length - 1].note == "*" && s.note == "*"
			&& acc[acc.length - 1].duration < 4 // ensure that rests are not too long
		) {
			acc[acc.length - 1].duration += s.duration
		} else {
			acc.push(s)
		}
		return acc
	}, [])

	return swaras
}

// Returns a AudioNode object that will produce a plucking sound
function pluck(context, frequency) {
	// Signal dampening amount
	let dampening = 0.99;

	function mute() {
		// dampening = 0.89;
		dampening = 0.9;
	}

	// We create a script processor that will enable
	// low-level signal sample access
	const pluck = context.createScriptProcessor(4096, 0, 1);

	// N is the period of our signal in samples
	const N = Math.round(context.sampleRate / frequency);

	// y is the signal presently
	const y = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		// We fill this with gaussian noise between [-1, 1]
		y[i] = Math.random() * 2 - 1;
	}

	// This callback produces the sound signal
	let n = 0;
	pluck.onaudioprocess = function (e) {
		// We get a reference to the outputBuffer
		const output = e.outputBuffer.getChannelData(0);

		// We fill the outputBuffer with our generated signal
		for (let i = 0; i < e.outputBuffer.length; i++) {
			// This averages the current sample with the next one
			// Effectively, this is a lowpass filter with a
			// frequency exactly half of sampling rate
			y[n] = (y[n] + y[(n + 1) % N]) / 2;

			// Put the actual sample into the buffer
			output[i] = y[n];

			// Hasten the signal decay by applying dampening.
			y[n] *= dampening;

			// Counting constiables to help us read our current
			// signal y
			n++;
			if (n >= N) n = 0;
		}
	};

	// The resulting signal is not as clean as it should be.
	// In lower frequencies, aliasing is producing sharp sounding
	// noise, making the signal sound like a harpsichord. We
	// apply a bandpass centred on our target frequency to remove
	// these unwanted noise.
	const bandpass = context.createBiquadFilter();
	bandpass.type = "bandpass";
	bandpass.frequency.value = frequency;
	bandpass.Q.value = 1;

	// We connect the ScriptProcessorNode to the BiquadFilterNode
	pluck.connect(bandpass);

	// Our signal would have died down by 2s, so we automatically
	// disconnect eventually to prevent leaking memory.
	setTimeout(() => {
		pluck.disconnect();
	}, 2000);
	setTimeout(() => {
		bandpass.disconnect();
	}, 2000);

	// The bandpass is last AudioNode in the chain, so we return
	// it as the "pluck"
	// return bandpass;

	return {
		connect: function (dst) {
			bandpass.connect(dst);
		},
		mute: mute,
	}
}


function notationToAudioRealtime(notes, callback) {
	const unit_duration = 0.25; // seconds
	const ctx = new (window.AudioContext || window.webkitAudioContext)();
	const swaras = adjust_swaras(notation2swaras(notes));

	const sargam = "sRrGgmMpDdNn";
	let currentTime = ctx.currentTime;

	const ids = [];

	for (let i = 0; i < swaras.length; i++) {
		const { note, duration, octave } = swaras[i];
		const index = sargam.indexOf(note);

		if (index === -1) continue; // skip invalid note

		const midiNote = 60 + index + (octave - 4) * 12; // base C = 60
		const frequency = midiToFrequency(midiNote);

		// Create a pluck sound
		const id = setTimeout(() => {
			const pluckNode = pluck(ctx, frequency);
			pluckNode.connect(ctx.destination);
		}, currentTime * 1000);
		ids.push(id);

		// Move time forward
		currentTime += duration * unit_duration;
	}

	setTimeout(() => {
		callback();
	}, currentTime * 1000);

	return {
		stop: function () {
			ids.forEach(id => clearTimeout(id));
			ctx.close();
		}
	}
}
