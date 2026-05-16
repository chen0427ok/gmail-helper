chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'polite-mail',
    title: '轉換成有禮貌書信',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'polite-mail' || !tab?.id) return
  chrome.tabs.sendMessage(tab.id, {
    type: 'CONVERT_SELECTION',
    text: info.selectionText,
  })
})
