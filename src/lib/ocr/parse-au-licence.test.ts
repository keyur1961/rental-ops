import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAuLicence } from "./parse-au-licence";

describe("parseAuLicence", () => {
  it("reads a Queensland-style card", () => {
    const text = `
QUEENSLAND DRIVER LICENCE
JAMIE ALEX RIVERA
Licence No 08451236
Class C
Date of Birth 14/03/1994
Expiry 18/11/2028
Address 22 Vulture Street, West End QLD 4101
`;
    const parsed = parseAuLicence(text);
    assert.equal(parsed.name, "JAMIE ALEX RIVERA");
    assert.equal(parsed.licenceNumber, "08451236");
    assert.equal(parsed.licenceClass, "C");
    assert.equal(parsed.dob, "14/03/1994");
    assert.equal(parsed.expiry, "18/11/2028");
    assert.match(parsed.address ?? "", /West End QLD 4101/);
  });

  it("reads labelled name and hyphenated dates", () => {
    const text = `
Name: Chen, Mei Lin
Licence number: NSW1234567
License class: C RE
DOB: 02-07-1990
Expires: 09-01-2027
Address: 10 Oxford St, Paddington NSW 2021
`;
    const parsed = parseAuLicence(text);
    assert.equal(parsed.name, "Chen, Mei Lin");
    assert.equal(parsed.licenceNumber, "NSW1234567");
    assert.equal(parsed.licenceClass, "C RE");
    assert.equal(parsed.dob, "02/07/1990");
    assert.equal(parsed.expiry, "09/01/2027");
  });
});
