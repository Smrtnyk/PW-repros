import { expect } from '@playwright/test';
import { test } from "./fixtures";

test("passes with custom asymmetric matcher",  async ({ browserName}) => {
   expect([{
      a: 1,
      b: 2,
      ...(getDefaultExpectedPropsForBrowser(browserName))
   },{
      a: 1,
      b: 2,
      h: 3,
      ...(getDefaultExpectedPropsForBrowser(browserName))
   },{
      a: 1,
      b: 2,
      ...(getDefaultExpectedPropsForBrowser(browserName))
   }]).toContainEqual({
      a: 1,
      b: 2,
   });
});

export function getDefaultExpectedPropsForBrowser(browserName: string): any {
   if (browserName === "chromium") {
      return {
         d: expect.any(String),
         c: expect.undefinedOrAny(Number),
      };
   }
   return {};
}
