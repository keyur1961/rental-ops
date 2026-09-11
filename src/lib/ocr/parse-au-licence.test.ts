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

  it("reads the current QLD plastic card layout", () => {
    const text = `
Driver Licence
NGUYEN
THI MAI ANH
LICENCE NO. / CRN
098 765 432
DOB 19 Jan 1981
Class Type Effective Expiry
C O 03.07.26 21.07.31
Conditions
Queensland Government
`;
    const parsed = parseAuLicence(text);
    assert.equal(parsed.name, "NGUYEN THI MAI ANH");
    assert.equal(parsed.licenceNumber, "098765432");
    assert.equal(parsed.licenceClass, "C");
    assert.equal(parsed.dob, "19/01/1981");
    assert.equal(parsed.expiry, "21/07/2031");
  });

  it("reads a QLD back without an Address label", () => {
    const text = `
UNIT 23
36 EXAMPLE STREET
WEST END 4109

Update your information at:
tmr.qld.gov.au/address

Drive Safely
Card number
DAC 841 3FA 2
`;
    const parsed = parseAuLicence(text);
    assert.match(parsed.address ?? "", /36 EXAMPLE STREET/);
    assert.match(parsed.address ?? "", /WEST END 4109/);
    assert.equal(parsed.licenceNumber, undefined);
  });

  it("does not treat effective dates or OCR junk as address or expiry", () => {
    const text = `
LICENCE NO. / CRN
098 765 432
DOB 19 Jan 1981
Class Type Effective 5987 31
CA 03.07.26 2
Queensland Government
`;
    const parsed = parseAuLicence(text);
    assert.equal(parsed.licenceNumber, "098765432");
    assert.equal(parsed.dob, "19/01/1981");
    assert.equal(parsed.expiry, undefined);
    assert.equal(parsed.address, undefined);
  });

  it("recovers fields from noisy phone OCR of a QLD front", () => {
    const text = `
LICENCE NO. / CRN
NGUYEN 098 765 432 |
THI MAI ANH
DOB 19 Jan 1981
Class 3 Effective
(V
03.07 26 21 07.31
Queensland
Government
`;
    const parsed = parseAuLicence(text);
    assert.equal(parsed.licenceNumber, "098765432");
    assert.equal(parsed.name, "NGUYEN THI MAI ANH");
    assert.equal(parsed.dob, "19/01/1981");
    assert.equal(parsed.expiry, "21/07/2031");
  });
});
