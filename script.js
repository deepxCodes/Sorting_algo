let array = [];
let delay = 200;
let isSorting = false;
let comparisons = 0, swaps = 0, accesses = 0;
const barWidth = 30;
let currentAlgo = 'bubble';
let demoRunning = false;
let currentMinIndex = -1;
let memeEnabled = true;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function resetStats() { comparisons = swaps = accesses = 0; updateStats(); }
function updateStats() {
    document.getElementById('comparisons').textContent = comparisons;
    document.getElementById('swaps').textContent = swaps;
    document.getElementById('accesses').textContent = accesses;
}
function updateComplexity() {
    let text = '';
    switch (currentAlgo) {
        case 'bubble': text = 'Time: Best O(n), Avg O(n^2), Worst O(n^2) | Space: O(1)'; 
            break;
        case 'selection': text = 'Time: Best O(n^2), Avg O(n^2), Worst O(n^2) | Space: O(1)'; 
            break;
        case 'insertion': text = 'Time: Best O(n), Avg O(n^2), Worst O(n^2) | Space: O(1)'; 
            break;
        case 'merge': text = 'Time: Best O(n log n), Avg O(n log n), Worst O(n log n) | Space: O(n)'; 
            break;
        case 'quick': text = 'Time: Best O(n log n), Avg O(n log n), Worst O(n^2) | Space: O(log n)'; 
            break;
    }
    document.getElementById('complexity').textContent = text;
}

function generateArray() {
    if (isSorting) return;
    resetStats();
    array = [];
    const size = document.getElementById('size').value;
    for (let i = 0; i < size; i++) array.push(Math.floor(Math.random() * 100) + 1);
    drawBars();
}

function generateCustomArray() {
    if (isSorting) return;
    resetStats();
    const input = document.getElementById('custom').value.trim();
    if (!input) { alert('Enter valid numbers!'); return; }
    array = input.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    drawBars();
}

function drawBars(highlight = [], pivotIndex = -1, sortedIndices = [], blankIndex = -1, keyIndex = -1) {
    const container = document.getElementById('bars-container');
    container.innerHTML = '';
    array.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.classList.add('bar', 'show');
        bar.style.height = (value * 3) + 'px';
        if (index === keyIndex) {
            bar.classList.add('key');
            bar.textContent = value;
        } else {
            bar.textContent = (index === blankIndex) ? '' : value;
        }
        if (highlight.includes(index)) bar.classList.add('comparing');
        if (index === pivotIndex) bar.classList.add('pivot');
        if (index === currentMinIndex) bar.classList.add('min');
        if (sortedIndices.includes(index)) bar.classList.add('sorted');
        container.appendChild(bar);
    });
}

function updateDelay() {
    const speedValue = document.getElementById('speed').value;
    const minRaw = 10, maxRaw = 300;
    const rawFraction = (speedValue - minRaw) / (maxRaw - minRaw);
    const level = Math.round(rawFraction * 9) + 1; 
    document.getElementById('speed-level').textContent = level;
    const minDelay = 50; 
    const maxDelay = 700; 
    delay = Math.floor(maxDelay - rawFraction * (maxDelay - minDelay));
}

const sizeSlider = document.getElementById('size');
const sizeValueLabel = document.getElementById('size-value');
if (sizeSlider && sizeValueLabel) {
    sizeValueLabel.textContent = sizeSlider.value;
    sizeSlider.addEventListener('input', e => {
        sizeValueLabel.textContent = e.target.value;
    });
}

const speedSlider = document.getElementById('speed');
const speedLevelLabel = document.getElementById('speed-level');
if (speedSlider && speedLevelLabel) {
    
    updateDelay();
    speedSlider.addEventListener('input', () => updateDelay());
}

async function swapBars(i, j, duration = 500) {
    const container = document.getElementById('bars-container');
    const bars = container.children;
    const barA = bars[i];
    const barB = bars[j];
    const dist = (j - i) * barWidth;

    if (!isSorting) return; 

    barA.classList.add('comparing');
    barB.classList.add('comparing');

    barA.style.transition = `transform ${duration}ms ease`;
    barB.style.transition = `transform ${duration}ms ease`;
    barA.style.transform = `translateX(${dist}px) translateY(-20px)`;
    barB.style.transform = `translateX(${-dist}px)`;

    await sleep(duration);

    if (!isSorting) {
        try { barA.style.transform = ''; barB.style.transform = ''; } catch (e) {}
        barA.classList.remove('comparing');
        barB.classList.remove('comparing');
        return;
    }

    [array[i], array[j]] = [array[j], array[i]];

    drawBars();
}

async function animateMove(fromIndex, toIndex) {
    const container = document.getElementById('bars-container');
    const bars = Array.from(container.querySelectorAll('.bar'));
    const src = bars[fromIndex];
    const dst = bars[toIndex];
    if (!src || !dst) return;
    if (!isSorting) return;

    const containerRect = container.getBoundingClientRect();
    const rectS = src.getBoundingClientRect();
    const rectD = dst.getBoundingClientRect();

    const clone = src.cloneNode(true);
    clone.classList.add('bar-clone');
    clone.style.left = (rectS.left - containerRect.left) + 'px';
    clone.style.top = (rectS.top - containerRect.top) + 'px';
    clone.style.width = rectS.width + 'px';
    clone.style.height = rectS.height + 'px';
    container.appendChild(clone);

    dst.style.opacity = '0.35';

    const deltaX = rectD.left - rectS.left;
    const deltaY = rectD.top - rectS.top;
    
    clone.style.transform = '';
    const duration = 420;
    const lift = -28;
    const anim = clone.animate([
        { transform: 'translate(0px, 0px) scale(1)' },
        { transform: `translate(${deltaX / 2}px, ${lift}px) scale(1.04)` },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(1)` }
    ], { duration, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    await anim.finished;
    if (!isSorting) { try { clone.remove(); dst.style.opacity = ''; } catch (e) {} ; return; }

    array[toIndex] = array[fromIndex];

    try { clone.remove(); } catch (e) {}
    dst.style.opacity = '';
    drawBars();
}

async function animatePlace(value, toIndex) {
    const container = document.getElementById('bars-container');
    const bars = Array.from(container.querySelectorAll('.bar'));
    const dst = bars[toIndex];
    if (!dst) return;
    if (!isSorting) return;

    const containerRect = container.getBoundingClientRect();
    const rectD = dst.getBoundingClientRect();

    const clone = document.createElement('div');
    clone.className = 'bar bar-clone';
    clone.style.height = (value * 3) + 'px';
    clone.textContent = value;
    
    clone.style.left = (rectD.left - containerRect.left) + 'px';
    clone.style.top = (rectD.top - containerRect.top - 60) + 'px';
    clone.style.width = rectD.width + 'px';
    container.appendChild(clone);

    dst.style.opacity = '0.35';
    
    clone.style.transform = '';
    const duration = 420;
    const lift = -28;
    const anim = clone.animate([
        { transform: 'translate(0px, 0px) scale(1)' },
        { transform: `translate(0px, ${lift}px) scale(1.04)` },
        { transform: `translate(0px, 60px) scale(1)` }
    ], { duration, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    await anim.finished;
    if (!isSorting) { try { clone.remove(); dst.style.opacity = ''; } catch (e) {} ; return; }
    array[toIndex] = value;
    try { clone.remove(); } catch (e) {}
    dst.style.opacity = '';
    drawBars();
}

const algorithmLogics = {
    bubble: `
Bubble Sort:
int i, j, k, key;

    for (i = 1; i < n; i++) {
        for (j = 0; j < n - i; j++) {
            if (arr[j] > arr[j + 1]) {
                key = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = key;
            }
        }
    }
`,
    selection: `
Selection Sort:
int n, i, j, min, temp;

    for(i=0; i<n-1; i++){
        min = i;
        for(j=i+1; j<n; j++){
            if(arr[j]<arr[min]){
                min = j;
            }
        }
        if(min != i){
            temp = arr[i];
            arr[i] = arr[min];
            arr[min] = temp;
        }
    }
`,
    insertion: `
Insertion Sort:
int n, i, j;

    for(i=0; i<n; i++){
            int key = arr[i];
            j = i-1;
            while(j>=0 && arr[j]>key){
                arr[j+1]=arr[j];
                j--;
            }
         arr[j+1] = key;
       }
`,
    merge: `
Merge Sort:
void merge(int arr[], int l, int m, int r) {
    int i, j, k;
    int n1 = m - l + 1;
    int n2 = r - m;

    int L[n1], R[n2];

    for (i = 0; i < n1; i++)
        L[i] = arr[l + i];
    for (j = 0; j < n2; j++)
        R[j] = arr[m + 1 + j];

    i = 0;
    j = 0;
    k = l;

    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }

    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        int m = (l + r) / 2;

        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);

        merge(arr, l, m, r);
    }
}
`,
    quick: `
Quick Sort:
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];  
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {  
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return i + 1;  
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);

        quickSort(arr, low, pi - 1); 
        quickSort(arr, pi + 1, high); 
    }
}
`
};

function updateAlgorithmLogic() {
    document.getElementById('logic-content').textContent = algorithmLogics[currentAlgo];
}

async function bubbleSort() {
    for (let i = 0; i < array.length - 1; i++) {
        for (let j = 0; j < array.length - i - 1; j++) {
            if (!isSorting) return; 
            comparisons++; accesses += 2; updateStats();
            if (array[j] > array[j + 1]) {
                swaps++; accesses += 2;
                await swapBars(j, j + 1);
                if (!isSorting) return;
            }
            await sleep(delay);
            if (!isSorting) return;
        }
        
        if (!isSorting) return;
        const sortedTail = [];
        for (let s = array.length - i - 1; s < array.length; s++) sortedTail.push(s);
        drawBars([], -1, sortedTail);
    }
}

async function selectionSort() {
    for (let i = 0; i < array.length; i++) {
        let min = i;
        for (let j = i + 1; j < array.length; j++) {
            if (!isSorting) return; 
            comparisons++; accesses++; updateStats();
            if (array[j] < array[min]) min = j;
            await sleep(delay);
            if (!isSorting) return;
        }
        if (min !== i) {
            swaps++; accesses += 2;
            showMeme();
            await swapBars(i, min, 1200);
            hideMeme();
            if (!isSorting) return;
            updateStats();
        }
        
        if (!isSorting) return;
        const sortedLeft = [];
        for (let s = 0; s <= i; s++) sortedLeft.push(s);
        drawBars([], -1, sortedLeft);
    }
}

function showMeme() {
    const toggle = document.getElementById('meme-toggle');
    memeEnabled = toggle ? toggle.checked : memeEnabled;
    if (!memeEnabled) return;
    const c = document.getElementById('meme-container');
    const v = document.getElementById('meme-video');
    if (!c || !v) return;
    c.classList.add('show');
    try { v.currentTime = 0; v.play(); } catch (e) {}
}

function hideMeme() {
    const c = document.getElementById('meme-container');
    const v = document.getElementById('meme-video');
    if (!c || !v) return;
    c.classList.remove('show');
    try { v.pause(); v.currentTime = 0; } catch (e) {}
}

async function insertionSort() {
    for (let i = 1; i < array.length; i++) {
        if (!isSorting) return;
        let key = array[i];
        let j = i - 1;

            drawBars([], -1, [], i, i);
        accesses++; updateStats();
        await sleep(delay);
        if (!isSorting) return;

        while (j >= 0 && array[j] > key) {
            if (!isSorting) return;
            comparisons++; accesses++;
            updateStats();

            await animateMove(j, j + 1);
            swaps++; accesses++; 
            if (!isSorting) return;
            j--;
            await sleep(delay);
        }

        if (!isSorting) return;
        await animatePlace(key, j + 1);
        accesses++; updateStats();
        await sleep(delay);
        if (!isSorting) return;
    }
    currentMinIndex = -1;
}





async function mergeSort(l = 0, r = array.length - 1) {
    if (!isSorting) return; 
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    await mergeSort(l, m);
    await mergeSort(m + 1, r);
    await merge(l, m, r);
}

async function merge(l, m, r) {
    let left = array.slice(l, m + 1);
    let right = array.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;

    while (i < left.length && j < right.length) {
        if (!isSorting) return;
        comparisons++; accesses += 2;

    drawBars([l + i, m + 1 + j]);
    await sleep(delay / 2);
    if (!isSorting) return; 

        if (left[i] <= right[j]) {
            const val = left[i];
            await animatePlace(val, k);
            i++;
        } else {
            const val = right[j];
            await animatePlace(val, k);
            j++;
        }
        swaps++; accesses++;
        animateBarMovement(k);  
        if (!isSorting) return; 
        updateStats();

        k++;
    }
    while (i < left.length) {
        if (!isSorting) return; 
        const val = left[i];
        await animatePlace(val, k);
        swaps++; accesses++;
        animateBarMovement(k);
        if (!isSorting) return; 
        updateStats();
        i++; k++;
    }
    while (j < right.length) {
        if (!isSorting) return;
        const val = right[j];
        await animatePlace(val, k);
        swaps++; accesses++;
        animateBarMovement(k);
        if (!isSorting) return; 
        updateStats();
        j++; k++;
    }
}


async function quickSort(l = 0, r = array.length - 1) {
    if (!isSorting) return; 
    if (l < r) {
        let pi = await partition(l, r);
        await quickSort(l, pi - 1);
        await quickSort(pi + 1, r);
    }
}

async function partition(l, r) {
    let pivot = array[r];
    let i = l - 1;
    for (let j = l; j < r; j++) {
        if (!isSorting) return i + 1; 
        comparisons++; accesses++;
        drawBars([j], r);
        await sleep(delay);
        if (!isSorting) return; 
        updateStats();
        if (array[j] < pivot) {
            i++;
            swaps++; accesses += 2;
            await swapBars(i, j);
            if (!isSorting) return;
            updateStats();
        }
    }
    swaps++; accesses += 2;
    await swapBars(i + 1, r);
    if (!isSorting) return; 
    return i + 1;
}

function markSorted() {
    drawBars([], -1, array.map((_, i) => i));
}

async function startSort() {
    if (isSorting) return;
    isSorting = true;
    updateDelay();
    updateComplexity();
    updateAlgorithmLogic();
    switch (currentAlgo) {
        case 'bubble': await bubbleSort(); break;
        case 'selection': await selectionSort(); break;
        case 'insertion': await insertionSort(); break;
        case 'merge': await mergeSort(); break;
        case 'quick': await quickSort(); break;
    }

    if (isSorting) markSorted();
    isSorting = false;
}
function animateBarMovement(index) {
    const bars = document.querySelectorAll('.bar');
    const bar = bars[index];
    if (bar) {
        bar.style.transform = 'translateY(-15px) scale(1.1)';
        setTimeout(() => {
            bar.style.transform = 'translateY(0) scale(1)';
        }, 300);
    }
}


async function autoDemo() {
    const btn = document.getElementById('auto-demo-btn');
    if (!btn || isSorting) return;
    demoRunning = true;
    btn.disabled = true;
    
    generateArray();
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    currentAlgo = 'insertion'; updateAlgorithmLogic(); updateComplexity();
    await sleep(400);
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    await startSort();
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    await sleep(600);

    generateArray();
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    currentAlgo = 'quick'; updateAlgorithmLogic(); updateComplexity();
    await sleep(300);
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    await startSort();
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    await sleep(600);

    generateArray();
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    currentAlgo = 'merge'; updateAlgorithmLogic(); updateComplexity();
    await sleep(300);
    if (!demoRunning) { btn.disabled = false; demoRunning = false; return; }
    await startSort();

    btn.disabled = false;
    demoRunning = false;
}

const autoBtn = document.getElementById('auto-demo-btn');
if (autoBtn) autoBtn.addEventListener('click', autoDemo);

document.getElementById('algorithm').addEventListener('change', e => { currentAlgo = e.target.value; updateComplexity(); updateAlgorithmLogic(); });

generateArray();
updateAlgorithmLogic();

function stopSort() {
    if (!isSorting) return;
    
    isSorting = false;
    
    demoRunning = false;
    
    document.querySelectorAll('.bar-clone').forEach(n => n.remove());
    
    try { hideMeme(); } catch (e) {}

    drawBars();
    
    const autoBtn = document.getElementById('auto-demo-btn'); if (autoBtn) autoBtn.disabled = false;
}

const stopBtn = document.getElementById('stop-btn');
if (stopBtn) stopBtn.addEventListener('click', stopSort);
