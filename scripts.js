const container = document.querySelector('#container');

setInterval(() => {
    const block = document.createElement('div');
    
    block.style.cssText = `
        width: 100px;
        height: 100px;
        background: #111;
        position: absolute;
        left: ${Math.random() * (container.offsetWidth - 100)}px;
        top: ${Math.random() * (container.offsetHeight - 100)}px;
    `;
    
    container.appendChild(block);
}, 1000);