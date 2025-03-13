import { test, expect } from "@playwright/test";

/**
 * This test reproduces a bug in Playwright"s Firefox implementation
 * where dragend event reports negative pageY coordinates
 */
test.only("reports positive pageY in dragend event", async ({ page }) => {
  await page.goto("about:blank");

  await page.setContent(`
    <style>
      #draggable {
        width: 100px;
        height: 100px;
        background-color: #3498db;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
      }
      #logger {
        margin-top: 20px;
        border: 1px solid #ccc;
        padding: 10px;
        height: 200px;
        overflow: auto;
        white-space: pre;
        font-family: monospace;
      }
    </style>
    
    <div id="draggable" draggable="true">Drag Me</div>
    <div id="dropzone">Drop Zone</div>
    <div id="logger"></div>
    
    <script>
      const logger = document.getElementById("logger");
      const draggable = document.getElementById("draggable");
      
      function log(message) {
        logger.textContent += message + "\\n";
        logger.scrollTop = logger.scrollHeight;
      }
      
      log("Browser: " + navigator.userAgent);
      
      draggable.addEventListener("dragstart", (e) => {
        log("DRAGSTART - " + 
            "pageX: " + e.pageX + ", " +
            "pageY: " + e.pageY + ", " +
            "clientX: " + e.clientX + ", " + 
            "clientY: " + e.clientY + ", " +
            "screenX: " + e.screenX + ", " + 
            "screenY: " + e.screenY);
      });
      
      draggable.addEventListener("drag", (e) => {
        if (Math.random() < 0.1) {
          log("DRAG - " + 
              "pageX: " + e.pageX + ", " +
              "pageY: " + e.pageY + ", " +
              "clientX: " + e.clientX + ", " + 
              "clientY: " + e.clientY + ", " +
              "screenX: " + e.screenX + ", " + 
              "screenY: " + e.screenY);
        }
      });
      
      draggable.addEventListener("dragend", (e) => {
        log("DRAGEND - " + 
            "pageX: " + e.pageX + ", " +
            "pageY: " + e.pageY + ", " +
            "clientX: " + e.clientX + ", " + 
            "clientY: " + e.clientY + ", " +
            "screenX: " + e.screenX + ", " + 
            "screenY: " + e.screenY);
            
        if (e.pageY < 0) {
          log("⚠️ NEGATIVE pageY DETECTED IN DRAGEND!");
        }
        
        document.body.setAttribute('data-dragend-pagey', e.pageY);
      });
      
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          log("ESC key pressed");
        }
      });
    </script>
  `);

  const draggableElement = page.locator("#draggable");
  await draggableElement.waitFor({state: "visible"});

  const boundingBox = await draggableElement.boundingBox();
  expect(boundingBox).toBeTruthy();
  const startX = boundingBox!.x + boundingBox!.width / 2;
  const startY = boundingBox!.y + boundingBox!.height / 2;
  const moveToX = startX + 50;
  const moveToY = startY + 30;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(moveToX, moveToY);
  await page.mouse.up();

  await page.waitForTimeout(500);

  const logs = await page.locator("#logger").textContent();
  console.log(logs);

  const dragendPageY = await page.evaluate(() => {
    return parseInt(document.body.getAttribute("data-dragend-pagey") || "0", 10);
  });

  expect(dragendPageY, `dragend pageY should not be negative}`).toBeGreaterThanOrEqual(0);
});
