// @flow

import { prepareWhere, prepareSet } from "../QueryHelper";

describe("QueryHelper", () => {
  describe("prepareWhere", () => {
    it("should return where equals", () => {
      const where = prepareWhere({ name: "Olaf" }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where greater than 0", () => {
      const where = prepareWhere({ assigned: { $gt: 0 } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where starts with", () => {
      const where = prepareWhere({ name: { $sw: "O" } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where ends with", () => {
      const where = prepareWhere({ name: { $ew: "f" } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where contains", () => {
      const where = prepareWhere({ name: { $contains: "la" } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where contains", () => {
      const where = prepareWhere({ name: { $contains: "la" } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where regex", () => {
      const where = prepareWhere({ name: { $reg: "Ol.?f" } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where greater than", () => {
      const where = prepareWhere({ age: { $gt: 5 } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where greater than equal", () => {
      const where = prepareWhere({ age: { $gte: 5 } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where less than", () => {
      const where = prepareWhere({ age: { $lt: 5 } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where less than equal", () => {
      const where = prepareWhere({ age: { $lte: 5 } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where starts with or ends with", () => {
      const where = prepareWhere(
        { name: { $or: [{ $sw: "O" }, { $ew: "f" }] } },
        "a"
      );
      expect(where).toMatchSnapshot();
    });

    it("should return where starts with and ends with", () => {
      const where = prepareWhere(
        { name: { $and: [{ $sw: "O" }, { $ew: "f" }] } },
        "a"
      );
      expect(where).toMatchSnapshot();
    });

    it("should return where name in string array", () => {
      const where = prepareWhere({ name: { $in: ["Olaf", "Hubert"] } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where not name equals", () => {
      const where = prepareWhere({ name: { $not: { $eq: "Olaf" } } }, "a");
      expect(where).toMatchSnapshot();
    });

    it("should return where with between", () => {
      const where1 = prepareWhere({ age: { $between: [2, 1] } }, "a");
      const where2 = prepareWhere({ age: { $between: [1, 2] } }, "a");
      expect(where1).toEqual(where2);
      expect(where1).toMatchSnapshot();
    });

    it("should return big where query", () => {
      const where = prepareWhere(
        {
          name: {
            $or: [
              { $eq: "Hans" },
              {
                $and: [{ $sw: "O" }, { $reg: "Ol.?f" }],
              },
            ],
          },
          age: {
            $and: [
              {
                $or: [{ $lt: 5 }, { $gt: 1 }, { $lt: 15 }, { $gt: 10 }],
              },
              { $in: [1, 2, 3, 4, 5, 11, 13] },
            ],
          },
        },
        "a"
      );
      expect(where).toMatchSnapshot();
    });

    it("should return big where query with not", () => {
      const where = prepareWhere(
        {
          name: {
            $not: {
              $or: [
                { $eq: "Hans" },
                {
                  $and: [{ $sw: "O" }, { $reg: "Ol.?f" }],
                },
              ],
            },
          },
          age: {
            $and: [
              {
                $or: [{ $lt: 5 }, { $gt: 1 }, { $lt: 15 }, { $gt: 10 }],
              },
              { $in: [1, 2, 3, 4, 5, 11, 13] },
            ],
          },
        },
        "a"
      );
      expect(where).toMatchSnapshot();
    });
  });

  describe("prepareSet", () => {
    it("should return set with single value", () => {
      const set = prepareSet({ name: "Olaf" }, "o");
      expect(set).toMatchSnapshot();
    });

    it("should return set with multiple variables and single value", () => {
      const set = prepareSet(
        {
          o: { name: "Olaf" },
          u: { name: "Ignatz" },
        },
        ["o", "u"]
      );
      expect(set).toMatchSnapshot();
    });

    it("should return set with multiple values", () => {
      const set = prepareSet({ name: "Olaf", age: 43 }, "o");
      expect(set).toMatchSnapshot();
    });

    it("should return set with multiple variables and multiple value", () => {
      const set = prepareSet(
        {
          o: { name: "Olaf", age: 20 },
          u: { name: "Ignatz", age: 20 },
        },
        ["o", "u"]
      );
      expect(set).toMatchSnapshot();
    });
  });
});
