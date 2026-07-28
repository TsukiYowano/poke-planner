import { describe, expect, it } from "vitest";
import { synchronizeScrollLeft } from "./useSynchronizedHorizontalScroll";

describe("synchronizeScrollLeft", () => {
  it("sourceのscrollLeftをtargetへ同期する", () => {
    const source = { scrollLeft: 240 };
    const target = { scrollLeft: 10 };
    synchronizeScrollLeft(source, target);
    expect(target.scrollLeft).toBe(240);
  });

  it("同じscrollLeftの場合は値を変更しない", () => {
    let writes = 0;
    const target = {
      get scrollLeft() {
        return 80;
      },
      set scrollLeft(_value: number) {
        writes += 1;
      },
    };
    synchronizeScrollLeft({ scrollLeft: 80 }, target);
    expect(writes).toBe(0);
  });
});
