export class Swiper {
  constructor(element, options = {}) {
    this.element = element;

    const DEFAULT_CONFIG = {
      minOpacity: 0.2,
      maxOpacity: 1,
      minScale: 0.2,
      maxScale: 1,
      velocityBoost: 36,
      friction: 3,
      fisrtIndex: 1,
    };

    this.config = {
      ...DEFAULT_CONFIG,
      ...options,
    }

    this.measurements = {
      swiperPadding: 0,
      swiperCenter: 0,
      cardWidth: 0,
      cardCount: 0,
      containerGap: 0,
      containerPadding: 0,
      step: 0,
      startPosition: 0,
      startIndex: 0,
    };

    this.state = {
      position: 0,
      activeIndex: 0,
      isDragging: false,
      startPointerPosition: 0,
      velocity: 0,
      firstPositionToCalcVel: 0,
      firstTimeStamp: 0,
    };

    this.init();
  }
  //Method

  //Functions
  //1.Init
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.takeMeasurements();
    this.setInitialIndex(this.config.fisrtIndex);
  }

  cacheDOM() {
    this.container = this.element.querySelector(".container");
    this.cards = [...this.element.querySelectorAll(".container .card")];
    this.btnBack = this.element.querySelector(".btn.back");
    this.btnForward = this.element.querySelector(".btn.forward");
  }
  bindEvents() {
    this.handlePointerup = this.handlePointerup.bind(this);
    this.handlePointerdown = this.handlePointerdown.bind(this);
    this.handlePointermove = this.handlePointermove.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.handleForward = this.handleForward.bind(this);

    this.element.addEventListener("pointerup", this.handlePointerup);
    this.element.addEventListener("pointercancel", this.handlePointerup);
    this.element.addEventListener("pointerdown", this.handlePointerdown);
    this.element.addEventListener("pointermove", this.handlePointermove);
    this.btnBack.addEventListener("click", this.handleBack);
    this.btnForward.addEventListener("click", this.handleForward);
  }
  takeMeasurements() {
    const swiperRect = this.element.getBoundingClientRect();
    const cardRect = this.cards[0].getBoundingClientRect();
    const swiperStyle = getComputedStyle(this.element);
    const containerStyle = getComputedStyle(this.container);

    this.measurements.swiperPadding = parseFloat(swiperStyle.padding);
    this.measurements.swiperCenter = swiperRect.width / 2;
    this.measurements.cardWidth = cardRect.width;
    this.measurements.cardCount = this.cards.length;
    this.measurements.containerGap = parseFloat(containerStyle.columnGap);
    this.measurements.containerPadding = parseFloat(containerStyle.padding);
    this.measurements.step = this.measurements.cardWidth + this.measurements.containerGap;
  }
  setInitialIndex(startIndex) {
    this.state.activeIndex = startIndex;
    this.measurements.startIndex = startIndex;
    let sCenter = this.measurements.swiperCenter;
    let sPadding = this.measurements.swiperPadding;
    let cPadding = this.measurements.containerPadding;
    let cWidth = this.measurements.cardWidth;
    let step = this.measurements.step;

    this.measurements.startPosition = sCenter - sPadding - cPadding - cWidth/2 - startIndex * step
    this.render();
  }

  //2.Input
  handleBack() {
    this.state.position += this.measurements.step;
    this.state.activeIndex --;
    this.render();
  }
  handleForward() {
    this.state.position -= this.measurements.step;
    this.state.activeIndex ++;
    this.render();
  }
  handlePointerup(e) {
    let target = e.target;
    if(this.state.isDragging) {
      this.state.isDragging = false;
      this.element.releasePointerCapture(e.pointerId);
      this.updateVelocity(e.x, e.timeStamp)
      this.handleRelease();
      this.render();
      return
    }
  }
  handlePointerdown(e) {
    let target = e.target;
    if(target.closest(`.container`)) {
      this.state.isDragging = true;
      this.state.startPointerPosition = e.x;
      this.state.firstPositionToCalcVel = e.x;
      this.state.firstTimeStamp = e.timeStamp;
      this.element.setPointerCapture(e.pointerId);
      this.toggleTransitionStyle();
    }
  }
  handlePointermove(e) {
    if(!this.state.isDragging) return
    this.updatePosition(e.x);
    this.updateActiveIndex();
    this.render();
  }

  //3.Update
  updatePosition(x) {
    let dx = x - this.state.startPointerPosition;
    this.state.startPointerPosition = x;
    this.state.position += dx;
  }
  updateActiveIndex() {
    for(let i = 0; i < this.measurements.cardCount; i++) {
      let distanceToCenter = this.getCardDistanceFromCenter(i);
      let dx = this.measurements.step / 2;

      if(distanceToCenter >= -dx && distanceToCenter <= dx) {
        this.state.activeIndex = i;
        return
      }
    }
  }
  updateVelocity(x, ts) {
    this.state.velocity = this.config.velocityBoost * 
                          (x - this.state.firstPositionToCalcVel) / 
                          (ts - this.state.firstTimeStamp);
  }
  handleRelease() {
    let i = this.state.velocity > 0 ? 1 : -1; 
    while(this.state.velocity * i > 0) {
      this.state.position += this.state.velocity;
      this.updateActiveIndex();
      this.state.velocity -= i * this.config.friction;
      this.render();
    }
    this.toggleTransitionStyle();
    this.handleSnapping();
  }
  handleSnapping() {
    this.state.position = (this.measurements.startIndex - this.state.activeIndex) *
                          this.measurements.step;
  }

  //4.Render
  render() {
    this.renderContainer();
    this.renderCards();
    this.renderBtn();
  }
  renderContainer() {
    this.container.style.translate = `${this.state.position + this.measurements.startPosition}px 0px`
  }
  renderCards() {
    for(let i = 0; i < this.measurements.cardCount; i++) {
      let distance = Math.abs(this.getCardDistanceFromCenter(i));
      let maxDistance = this.measurements.step * (this.measurements.cardCount - 1);
      let progress = distance / maxDistance;

      let opacity = this.interpolate(this.config.minOpacity, this.config.maxOpacity, 1 - progress);
      let scale = this.interpolate(this.config.minScale, this.config.maxScale, 1 - progress);

      this.cards[i].style.opacity = `${opacity}`; 
      this.cards[i].style.scale = `${scale}`; 
    }
  }
  renderBtn() {
    this.btnBack.classList.remove("disabled");
    this.btnForward.classList.remove("disabled");

    if(this.state.activeIndex <= 0) {
      this.btnBack.classList.add("disabled");
    }
    if(this.state.activeIndex >= this.measurements.cardCount-1) {
      this.btnForward.classList.add("disabled");
    }
  }

  //Helper functions
  getCardDistanceFromCenter(index) {
    return (index - this.measurements.startIndex) * this.measurements.step + this.state.position;
  }
  interpolate(min, max, value) {
    return min + value * (max - min);
  }
  toggleTransitionStyle() {
    this.container.classList.toggle("isDragging");
    this.cards.forEach(card => card.classList.toggle("isDragging"));
  }
}