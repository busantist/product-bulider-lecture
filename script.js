const $ = (sel) => document.querySelector(sel);

const btn = $("#btn");
const copyBtn = $("#copy");
const result = $("#result");

const excludeRecent = $("#excludeRecent");
const recentBox = $("#recentBox");
const recentInput = $("#recentInput");

/**
 * ✅ 최근번호 저장/불러오기 (localStorage)
 */
const STORAGE_KEY = "vibeLotto_recentNums_v1";

// 페이지 열 때 저장된 값 불러오기
(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    recentInput.value = saved;
  }
})();

// 입력할 때마다 자동 저장
recentInput.addEventListener("input", () => {
  localStorage.setItem(STORAGE_KEY, recentInput.value);
});

/**
 * 유틸
 */
function parseNumbers(text) {
  // "3,7,15,16,19,43 | 1,9,..." 혹은 줄바꿈 구분을 허용
  const blocks = text
    .split(/\n|\|/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const sets = blocks.map((b) =>
    b
      .split(/[, ]+/g)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
  );

  // 두 회차 이상이 들어와도 일단 모두 합쳐서 제외 리스트로 사용
  return new Set(sets.flat());
}

function randomInt(min, max) {
  // min~max inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickLottoSet(excludeSet) {
  const picked = new Set();
  const maxTry = 10000;
  let tries = 0;

  while (picked.size < 6) {
    tries++;
    if (tries > maxTry) {
      throw new Error("제외 조건이 너무 강해서 번호를 뽑을 수 없어요. 제외 숫자를 줄여주세요.");
    }

    const n = randomInt(1, 45);
    if (excludeSet.has(n)) continue;
    picked.add(n);
  }

  return [...picked].sort((a, b) => a - b);
}

function generateFiveSets(excludeSet) {
  const sets = [];
  for (let i = 0; i < 5; i++) {
    sets.push(pickLottoSet(excludeSet));
  }
  return sets;
}

function formatSets(sets) {
  return sets
    .map((s, idx) => `${idx + 1}) ${s.map((n) => String(n).padStart(2, " ")).join("  ")}`)
    .join("\n");
}

/**
 * UI
 */
excludeRecent.addEventListener("change", () => {
  recentBox.classList.toggle("hidden", !excludeRecent.checked);
});

btn.addEventListener("click", () => {
  try {
    const excludeSet = excludeRecent.checked ? parseNumbers(recentInput.value) : new Set();
    const sets = generateFiveSets(excludeSet);
    const text = formatSets(sets);

    result.textContent = text;
    result.classList.remove("empty");
    copyBtn.disabled = false;
  } catch (e) {
    result.textContent = `⚠️ ${e.message}`;
    result.classList.remove("empty");
    copyBtn.disabled = true;
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.textContent);
    copyBtn.textContent = "복사됨!";
    setTimeout(() => (copyBtn.textContent = "결과 복사"), 900);
  } catch {
    alert("복사 권한이 없어요. 결과를 드래그해서 복사해 주세요.");
  }
});