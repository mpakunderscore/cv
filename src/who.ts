const updateCounter = async () => {
    const counterEl = document.getElementById('counter')
    if (!counterEl) return

    const url = new URL(window.location.href)
    const response = await fetch(`/api/counter?path=${encodeURIComponent(url.pathname)}`)
    const data: { value?: number | string } = await response.json()
    counterEl.textContent = String(data.value ?? '')
}

updateCounter()
