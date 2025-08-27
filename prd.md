👌好，那我帮你写一个 **最小化 Tone.js PRD**，只保留核心：**加载样本 + 播放/停止**，不写 `muteAll`。

---

## 🎶 PRD：Tone.js 音频播放 MVP

### 1. 目标

利用 Tone.js 构建一个最小化的鼓机原型，支持：

* 通过键盘或鼠标输入触发 sample 播放。
* 支持力度（velocity）。
* 提供统一接口：

  ```ts
  play(sampleName: string, options?: { velocity?: number }): void
  stop(sampleName: string): void
  ```

---

### 2. 功能范围

#### 播放层（AudioEngine）

* 使用 `Tone.Sampler` 加载 drumkit 样本。
* `play(sampleName, { velocity })`：

  * 播放对应 sample。
  * `velocity` 默认 100，映射到 `0–127` → `0–1`。
* `stop(sampleName)`：调用 `sampler.triggerRelease(sample)` 停止播放。

#### 输入层（InputHandler）

* **键盘输入**：

  * A → kick
  * S → snare
  * D → hi-hat
* **鼠标输入**：

  * 点击按钮播放对应 sample

---

### 3. 非功能性需求

* **解耦**：输入与播放层独立。
* **可扩展性**：未来可轻松加入 MIDI 输入或 muteAll。
* **跨平台**：浏览器可直接运行。

---

### 4. 用户流程

```mermaid
flowchart LR
    K[Keyboard] --> IH[InputHandler]
    M[Mouse] --> IH
    IH --> AE[AudioEngine (Tone.js Sampler)]
    AE --> SAMPLES[(Drum Samples)]
```

---

### 5. 示例代码（MVP 版本）

```ts
import * as Tone from "tone";

class AudioEngine {
  private sampler: Tone.Sampler;

  constructor() {
    this.sampler = new Tone.Sampler({
      urls: {
        "C1": "kick.wav",
        "D1": "snare.wav",
        "F#1": "hihat.wav"
      },
      baseUrl: "/samples/drumkit/"
    }).toDestination();
  }

  play(name: string, { velocity = 100 } = {}) {
    const vel = velocity / 127;
    this.sampler.triggerAttack(name, Tone.now(), vel);
  }

  stop(name: string) {
    this.sampler.triggerRelease(name, Tone.now());
  }
}

class InputHandler {
  constructor(private engine: AudioEngine) {}

  bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "a") this.engine.play("C1", { velocity: 100 });
      if (e.key === "s") this.engine.play("D1", { velocity: 100 });
      if (e.key === "d") this.engine.play("F#1", { velocity: 100 });
    });
  }

  bindMouse() {
    document.getElementById("kickBtn")?.addEventListener("click", () => {
      this.engine.play("C1", { velocity: 90 });
    });
    document.getElementById("snareBtn")?.addEventListener("click", () => {
      this.engine.play("D1", { velocity: 90 });
    });
  }
}
```

---

### 6. 开发里程碑

* v0.1：实现 `AudioEngine`（Tone.js Sampler），支持 play/stop。
* v0.2：绑定键盘输入。
* v0.3：绑定鼠标按钮。

