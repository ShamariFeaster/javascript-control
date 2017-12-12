const icon_disabled = {128: "js_disabled.png"}
const icon_whitelisted = {128: "js.png"}

function is_blacklisted(dict, host) {
    let blacklist_js = false
    if (dict[host] !== undefined) {
        blacklist_js = dict[host]
    }
    return blacklist_js
}

function add_csp_nojs_header(response) {
    let host = new URL(response.url).hostname
    let headers = response.responseHeaders
    return new Promise( (resolve) => {
        browser.storage.local.get(host).then(item => {
            let blacklist_js = is_blacklisted(item, host)
            if (blacklist_js) {
                var new_csp = {name: "Content-Security-Policy", value: "script-src 'none';"}
                headers.push(new_csp)
            }
            resolve({responseHeaders: headers})
        })
    })
}

browser.webRequest.onHeadersReceived.addListener(
    add_csp_nojs_header,
    {urls: ["<all_urls>"],
     types: ["main_frame"]},
    ["blocking", "responseHeaders"]
)

browser.tabs.onUpdated.addListener((id, changeInfo) => {
    if (changeInfo.url) {
        let host = new URL(changeInfo.url).hostname
        browser.storage.local.get(host).then(item => {
            let blacklist_js = is_blacklisted(item, host)

            let path_icon = blacklist_js ? icon_whitelisted : icon_disabled
            browser.pageAction.setIcon({
                path: path_icon,
                tabId: id
            })

            let word = blacklist_js ? "Enable" : "Disable"
            browser.pageAction.setTitle({
                title: word + " Javascript",
                tabId: id
            })
        })
    }
    browser.pageAction.show(id)
})

browser.pageAction.onClicked.addListener(function(tab) {
    let host = new URL(tab.url).hostname
    browser.storage.local.get(host).then(item => {
        let blacklist_js = is_blacklisted(item, host)
        let to_store = {}
        to_store[host] = !blacklist_js
        browser.storage.local.set(to_store).then( function() {
            browser.tabs.reload()
        })
    })
})
