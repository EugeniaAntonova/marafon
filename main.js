"use strict";
// rating

class RatingCreator {
  constructor() {
    this.itemTemplate = document.querySelector('#rating-item');
    this.parent = document.querySelector('#rating-list');
    this.getData(this.onSuccess.bind(this), this.onError.bind(this));
  }

  messages = {
    fail: 'Не удалось получить данные'
  }

  // createRating(data) {
  //   let list = [];
  //   data.forEach(item => {
  //     let { table_id, player_id, phone_number, amount } = item;
  //     if (!table_id) return;
  //     list.push(`
  //               <div class="rating__item" role="listitem">
  //           <div class="place js-place">
  //               <span class="text-shadow" aria-hidden="true">${table_id}</span>
  //               <span class="text">${table_id}</span>
  //           </div>
  //           <div class="id rating__section">
  //               <span class="title">player id</span>
  //               <span class="value js-id">${Number(player_id).toLocaleString('ru-RU')}</span>
  //           </div>
  //           <div class="phone rating__section">
  //               <span class="title">номер телефона</span>
  //               <span class="value js-phone">+7 ${phone_number.slice(1, 4)} ${phone_number.slice(4)}</span>
  //           </div>
  //           <div class="score rating__section">
  //               <span class="title">количество очков</span>
  //               <span class="value js-score">${Number(amount).toLocaleString('ru-RU')}</span>
  //           </div>
  //       </div>
  //       `)
  //   })

  //   this.parent.innerHTML = list.join('');
  // }

  createRating(data) {
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
      let { table_id, player_id, phone_number, amount } = item;
      if (!table_id) return;

      let clone = this.itemTemplate.content.cloneNode(true);
      clone.querySelector('.js-place .text-shadow').textContent = table_id;
      clone.querySelector('.js-place .text').textContent = table_id;
      clone.querySelector('.js-id').textContent = Number(player_id).toLocaleString('ru-RU');
      clone.querySelector('.js-phone').textContent = `+7 ${phone_number.slice(1, 4)} ${phone_number.slice(4)}`;
      clone.querySelector('.js-score').textContent = Number(amount).toLocaleString('ru-RU');

      fragment.appendChild(clone);
    });

    this.parent.appendChild(fragment);
  }

  onSuccess(data) {
    let arr = data.split(/\s/);
    arr = arr.filter(item => item.length > 1);
    const headers = arr[0].split(',');

    const users = arr.slice(1).map(row => {
      const user = {};
      headers.forEach((header, index) => {
        user[header.trim()] = row.split(',')[index];
      });
      return user;
    })
    this.createRating(users);
  }

  onError(error) {
    console.log('error', error);
    this.parent.innerHTML = `<p style="color: #c74929; text-align: center">${error}</p>`;
  }

  async getData(onSuccess, onFail) {
    try {
      const response = await fetch(
        './data.csv'
      );

      if (!response.ok) {
        throw new Error(this.messages.fail);
      }

      onSuccess(await response.text());
    } catch (error) {
      let errorMessage = error instanceof TypeError && error.message == 'Failed to fetch'
        ? this.messages.fail
        : this.messages.fail;

      this.onError(errorMessage)
    }
  };

  // getData() {
  //   console.log('get data');
  //   fetch('./data.csv')
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error(this.messages.fail);
  //       }
  //       return response.text();
  //     })
  //     .then((data) => {
  //       console.log('data', data);
  //       this.onSuccess(data);
  //     })
  //     .catch((error) => {
  //       let errorMessage = error instanceof TypeError && error.message == 'Failed to fetch'
  //         ? this.messages.fail
  //         : this.messages.fail;

  //       this.onError(errorMessage)
  //     });
  // }
}

// scrollers

class Scrollers {
  constructor() {
    this.bindEvents();
  }

  selectors = {
    scroller: 'js-scroller'
  }

  onClick(evt) {
    if (!evt.target.classList.contains(this.selectors.scroller)) return;
    let scroller = evt.target;
    let anchor = scroller.dataset.target;

    document.querySelector(`#${anchor}`).scrollIntoView({ block: "start", behavior: "smooth" })
  }
  bindEvents() {
    document.addEventListener('click', (evt) => this.onClick(evt));
  }
}

// form

class FormHandler {
  constructor() {
    this.init()
  }

  findElements() {
    this.form = document.querySelector('#check-form');
    this.input = this.form.querySelector("#phone");
    this.inputWrapper = this.form.querySelector('.input-wrapper');
    this.submit = this.form.querySelector('#check-submit');
    this.result = document.querySelector('#result');
  }

  init() {
    this.findElements();

    this.submit.setAttribute('disabled', 'true');
    this.bindEvents();
  }

  stateClasses = {
    active: 'active',
    invalid: 'invalid',
    valid: 'valid',
    loading: 'loading',
    filled: 'filled',
    mistake: 'vibrate'
  }

  constants = {
    phone_length: 13,
    country_code: '+7',
    operator_code: 700,
    url: 'https://1f51-92-46-46-162.ngrok-free.app/api/send-phone'
  }

  messages = {
    fail: "Не удалось подключиться к серверу. Проверьте соединение или попробуйте позже.",
    error: "Произошла ошибка. Пожалуйста, попробуйте позже.",
    negative: "Пользователь с таким номером не найден."
  }

  switchState(remove = null, add = null, element = null) {
    let arr = Array.isArray(remove) ? remove : [remove];
    arr.forEach(item => {
      element.classList.remove(this.stateClasses[item]);
    })

    if (add) {
      element.classList.add(add);
    }
  }

  initInput() {
    if (this.input.value.length < 3) {
      this.input.value = this.constants.country_code + ' ';
    }
  }

  onInputFocus() {
    this.switchState(['invalid', 'valid'], 'active', this.inputWrapper)

    this.initInput();

    this.input.selectionStart = this.constants.country_code.length + 1;
    this.input.selectionEnd = this.input.value.length;
    this.submit.removeAttribute('disabled');

    if (this.tip) {
      this.tip.remove();
      this.tip = null;
    }
  }

  onInputBlur() {
    if (!this.validate()) {
      this.switchState(['active', 'valid'], 'invalid', this.inputWrapper);

      this.makeTip('Не корректный номер');
    } else {
      this.switchState(['invalid', 'active'], 'valid', this.inputWrapper)
    }
  }

  makeTip(text) {
    this.tip = document.createElement('span');
    this.tip.classList.add('tip');
    this.tip.textContent = text;

    this.form.append(this.tip);
  }

  validate() {
    let value = this.input.value;
    return value.length === this.constants.phone_length && parseInt(value.slice(3, 6)) >= this.constants.operator_code && parseInt(value.slice(3, 6)) < this.constants.operator_code + 100;
  }

  onInputKeyDown(evt) {
    let key = evt.key;
    if (key) {
      if (
        !key.match(/[\d\.]|escape|enter|tab|arrow.+|delete|backspace/gi) ||
        key == "Dead"
      ) {
        evt.preventDefault();
      }
    }
  }

  makeResult(text, positive) {
    if (positive) {
      return `<output class="form-output" id="form-output" for="check-form" role="list">
      <span class="output-item" role="listitem">Ваш Player id - ${text.player_id}</span>
      <span class="output-item" role="listitem">Позиция в рейтинге: - ${text.table_id}</span>
      <span class="output-item" role="listitem">Количество очков: - ${text.amount}</span>
      </output>`;
    }

    return `<p class="error-message">${text}</p>`;
  }

  onFormSubmit(evt) {
    evt.preventDefault();
    if (!this.validate()) {
      this.inputWrapper.classList.add(this.stateClasses.mistake);
      this.inputWrapper.addEventListener('animationend', () => this.inputWrapper.classList.remove('vibrate'), { once: true });
      return;
    }
    const formattedPhone = `7${this.input.value.slice(this.constants.country_code.length + 1)}`;
    this.form.classList.add(this.stateClasses.loading);
    fetch(
      this.constants.url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(this.messages.error);
        }
        return response.json();
      })
      .then((json) => {
        this.form.classList.remove(this.stateClasses.loading);
        this.result.innerHTML = this.makeResult(json, true);
        this.result.classList.add(this.stateClasses.filled);
      })
      .catch((error) => {
        this.form.classList.remove(this.stateClasses.loading);

        let errorMessage = error instanceof TypeError && error.message == 'Failed to fetch'
          ? this.messages.fail
          : this.messages.error;

        this.result.innerHTML = this.makeResult(errorMessage);
        this.result.classList.add(this.stateClasses.filled);
      });
  }

  bindEvents() {
    this.input.addEventListener("focus", this.onInputFocus.bind(this));
    this.input.addEventListener("click", this.onInputFocus.bind(this));
    this.input.addEventListener("keydown", this.onInputKeyDown.bind(this));
    this.input.addEventListener("input", this.initInput.bind(this));
    this.input.addEventListener("blur", this.onInputBlur.bind(this));
    this.form.addEventListener("submit", this.onFormSubmit.bind(this))
  }
}

window.addEventListener('load', () => {
  // accordeon
  const accordeon = document.querySelector('.faq-list');

  const closePanel = (item) => {
    let panel = item.querySelector('.panel');
    item.classList.remove('opened');
    panel.style.maxHeight = `0`;
  }

  const openPanel = (item) => {
    let panel = item.querySelector('.panel');
    item.classList.add('opened');
    panel.style.maxHeight = `${panel.scrollHeight + 60}px`;
  }
  const onAccordeonClick = (evt) => {
    const target = evt.target;
    let opened = accordeon.querySelector('.opened');

    if (!target.classList.contains('js-toggle')) return;
    if (opened) {
      closePanel(opened);
    };

    let item = target.closest('div');

    if (item != opened) {
      openPanel(item);
      opened = item;
    }
  }

  accordeon.addEventListener('click', onAccordeonClick);

  new Scrollers();
  new RatingCreator();
  new FormHandler();
})