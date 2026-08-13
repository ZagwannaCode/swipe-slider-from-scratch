const slider = document.querySelector("#slider");
const container = document.querySelector("#slider .card-container");
const cards = [...document.querySelectorAll("#slider .card")];
const btns = [...document.querySelectorAll(".btn")];

const sliderState = {
  mouseX: 0,

  currentX: 0,
  cardsX: [],
  isSwiping: false,
};

const sliderData = {
  centerX: 0,
  step: 0,
  maxStep: 0,

  containerWidth: 0,
  containerHeight: 0,
  containerGap: 0,

  cardWidth: 0,
  cardCount: 0,
  cardsX: [],
};

init();

function init() {
  slider.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  slider.addEventListener("pointermove", handlePointerMove);

  updateSliderData();
}

function updateSliderData() {
  const containerStyle = window.getComputedStyle(container);

  sliderData.containerWidth = container.getBoundingClientRect().width;
  sliderData.containerHeight = container.getBoundingClientRect().height;
  sliderData.containerGap = parseFloat(containerStyle.gap);
  sliderData.cardWidth = cards[0].getBoundingClientRect().width;
  sliderData.cardCount = cards.length;
  sliderData.centerX = slider.getBoundingClientRect().width / 2;
  sliderData.step = cards[0].getBoundingClientRect().width + parseFloat(containerStyle.gap);
  sliderData.maxStep = sliderData.step * Math.floor(sliderData.cardCount / 2);

  initCardsX();
  renderSlider(makeValuesForStyling());
}

function handlePointerDown(e) {
  let target = e.target;
  if (target.closest(".card-container")) {
    sliderState.isSwiping = true;
    sliderState.mouseX = e.x;
  }
}

function handlePointerUp(e) {
  let target = e.target;
  if (sliderState.isSwiping) sliderState.isSwiping = false;
  if (target.closest(".btn")) {
    let d = sliderData.step;
    let dmax = sliderData.maxStep;
    let x = sliderState.currentX;

    target.closest(".back") ? x += d : x -= d;

    let inSliderRange = (x <= dmax && x >= -dmax);
    let isLast = !(x + d <= dmax && x - d >= -dmax);
    if (inSliderRange) {
      sliderState.currentX = x;
      updateSliderStateByUp();
      renderSlider(makeValuesForStyling());
    }
    if (isLast) {
      target.classList.add("disabled");
    }
  }
}

function handlePointerMove(e) {
  if(!sliderState.isSwiping) return;
  sliderState.currentX += (e.x - sliderState.mouseX);
  console.log(sliderState.currentX)
  sliderState.mouseX = e.x;
  renderSliderBySwipe();
}

function initCardsX() {
  let cardCount = sliderData.cardCount;
  let d = sliderData.step;
  let dmax = sliderData.maxStep;

  for(let i = 0; i < cardCount; i++) {
    let x = d * i - dmax;
    sliderData.cardsX.push(x);
    sliderState.cardsX.push(x);
  }
}

function updateSliderStateByUp() {
  sliderState.cardsX.forEach((value, i, arr) => {
    arr[i] = sliderData.cardsX[i] + sliderState.currentX;
  });
}

function makeValuesForStyling() {
  let cardCount = sliderData.cardCount;
  let d = sliderData.step;
  let dmax = sliderData.maxStep;

  let styleMin = 0.3;
  let styleMax = 1;

  let values = sliderState.cardsX.map(disToCenter => styleMax - Math.abs(disToCenter) / dmax * (styleMax - styleMin));

  return values;
}

function renderSlider(arr) {
  btns.forEach(btn => btn.classList.remove("disabled"))
  container.style.translate = `${sliderState.currentX}px 0`;


  cards.forEach((el, i) => {
    el.style.opacity = `${arr[i]}`;
    el.style.scale = `${arr[i]}`;
  });
}

function renderSliderBySwipe() {
  container.style.translate = `${sliderState.currentX}px 0`;
}