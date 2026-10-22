const STORAGE_KEY = 'trip-budget-plans'

const form = document.querySelector('#budget-form')
const reserveInput = document.querySelector('#reserve')
const reserveOutput = document.querySelector('#reserve-output')
const saveButton = document.querySelector('#save-button')
const saveMessage = document.querySelector('#save-message')
const savedList = document.querySelector('#saved-list')
const savedEmpty = document.querySelector('#saved-empty')
const savedCount = document.querySelector('#saved-count')
const cardTemplate = document.querySelector('#saved-card-template')

const outputElements = {
  total: document.querySelector('#total-value'),
  person: document.querySelector('#person-value'),
  transport: document.querySelector('#transport-value'),
  accommodation: document.querySelector('#accommodation-value'),
  food: document.querySelector('#food-value'),
  activities: document.querySelector('#activities-value'),
  reserve: document.querySelector('#reserve-value'),
}

const defaultValues = Object.fromEntries(new FormData(form))

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

function readForm() {
  const data = new FormData(form)

  return {
    tripName: String(data.get('tripName')).trim() || 'Без названия',
    travelers: Math.max(1, Number(data.get('travelers')) || 1),
    days: Math.max(1, Number(data.get('days')) || 1),
    transport: Math.max(0, Number(data.get('transport')) || 0),
    accommodation: Math.max(0, Number(data.get('accommodation')) || 0),
    food: Math.max(0, Number(data.get('food')) || 0),
    activities: Math.max(0, Number(data.get('activities')) || 0),
    reserve: Math.max(0, Number(data.get('reserve')) || 0),
  }
}

function calculate(values) {
  const foodTotal = values.food * values.travelers * values.days
  const subtotal = values.transport + values.accommodation + foodTotal + values.activities
  const reserveTotal = subtotal * (values.reserve / 100)
  const total = subtotal + reserveTotal

  return { ...values, foodTotal, reserveTotal, total, perPerson: total / values.travelers }
}

function updateSummary() {
  const result = calculate(readForm())
  reserveOutput.value = `${result.reserve}%`
  outputElements.total.textContent = formatMoney(result.total)
  outputElements.person.textContent = formatMoney(result.perPerson)
  outputElements.transport.textContent = formatMoney(result.transport)
  outputElements.accommodation.textContent = formatMoney(result.accommodation)
  outputElements.food.textContent = formatMoney(result.foodTotal)
  outputElements.activities.textContent = formatMoney(result.activities)
  outputElements.reserve.textContent = formatMoney(result.reserveTotal)
  return result
}

function getSavedPlans() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function setSavedPlans(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
}

function getCountLabel(count) {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  if (lastDigit === 1 && lastTwoDigits !== 11) return `${count} вариант`
  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) return `${count} варианта`
  return `${count} вариантов`
}

function fillForm(plan) {
  Object.entries(plan).forEach(([name, value]) => {
    const control = form.elements.namedItem(name)
    if (control) control.value = String(value)
  })
  updateSummary()
  window.scrollTo({ top: form.offsetTop - 20, behavior: 'smooth' })
}

function renderSavedPlans() {
  const plans = getSavedPlans()
  savedList.replaceChildren()
  savedCount.textContent = getCountLabel(plans.length)
  savedEmpty.hidden = plans.length > 0

  plans.forEach((plan) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true)
    card.querySelector('h3').textContent = plan.tripName
    card.querySelector('p').textContent = `${plan.travelers} чел. · ${plan.days} дн. · всего ${formatMoney(plan.total)}`
    card.querySelector('.saved-card__price strong').textContent = formatMoney(plan.perPerson)
    card.querySelector('.restore-button').addEventListener('click', () => fillForm(plan))
    card.querySelector('.delete-button').addEventListener('click', () => {
      setSavedPlans(getSavedPlans().filter((item) => item.id !== plan.id))
      renderSavedPlans()
    })
    savedList.append(card)
  })
}

form.addEventListener('input', updateSummary)

form.addEventListener('reset', () => {
  window.setTimeout(() => {
    Object.entries(defaultValues).forEach(([name, value]) => {
      const control = form.elements.namedItem(name)
      if (control) control.value = String(value)
    })
    updateSummary()
  })
})

saveButton.addEventListener('click', () => {
  if (!form.reportValidity()) return

  const result = updateSummary()
  const plans = getSavedPlans()
  plans.unshift({ id: crypto.randomUUID(), ...result })
  setSavedPlans(plans.slice(0, 8))
  renderSavedPlans()
  saveMessage.textContent = 'Расчёт сохранён.'
  window.setTimeout(() => {
    saveMessage.textContent = 'Расчёты сохраняются только в этом браузере.'
  }, 2200)
})

updateSummary()
renderSavedPlans()
