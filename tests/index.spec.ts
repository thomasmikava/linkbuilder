/* eslint-disable max-lines-per-function */
import {
  addPrefix,
  withParams,
  addMergingArgumentPrefix,
  addSplittingArgumentPrefix,
} from "../src";

const links = addPrefix(
  "m-admin",
  "mmm"
)({
  organizations: addPrefix("organizations")({
    create: "create",
    edit: withParams((id: number) => `edit/${id}`, `edit/:id`),
    edit2: withParams(
      (id: number) => `edit/${id}`,
      (a: number, b: number) => `edit/${a + b}`
    ),
    mash: addSplittingArgumentPrefix(
      (id: number) => `ll/${id}-id/`,
      (xo: number, ob: number) => `ll/:id-${xo + ob}/`
    )({
      gg: "a",
      laa: addSplittingArgumentPrefix(
        (id2: number) => `kl_${id2}`,
        (xoo: { name: string }) => `klll_${xoo.name}/`
      )({
        asd: "mk",
        xla: withParams(
          (laa: { how: string; are: number }) => `gn-${laa.how}-${laa.are}`,
          (la: number) => `poo${la}`
        ),
      }),
    }),
    codoa: addMergingArgumentPrefix(
      ({ weekType }: { weekType: number }) => `weeks/${weekType}`,
      "weeks/:weekType"
    )({
      laa: "a",
      xoo: withParams(
        ({ userId }: { userId: number }) => `users/${userId}`,
        "a"
      ),
      kio: addMergingArgumentPrefix(
        ({ subjectId }: { subjectId: string }) => `subjects/${subjectId}`,
        "subjects/:subjectId"
      )({
        will: "u",
        xoo: withParams(
          ({ userId }: { userId: number }) => `users/${userId}`,
          "a"
        ),
      }),
    }),
    abaRogor: addPrefix(
      ({ weekType }: { weekType: number }) => `weeks/${weekType}`,
      ({ weekTypeX }: { weekTypeX: number }) => `weeks/:weekType-${weekTypeX}`
    )({
      laa: "a",
      la2: withParams(
        ({ userId }: { userId: number }) => `users/${userId}`,
        "a"
      ),
      kio222: addPrefix(
        ({ subjectId }: { subjectId: string }) => `subjects/${subjectId}`,
        "subjects/:subjectId"
      )({
        will: "u",
        xoo: withParams(
          ({ userId }: { userId: number }) => `users/${userId}`,
          "a"
        ),
      }),
      kio: addMergingArgumentPrefix(
        ({ subjectId }: { subjectId: string }) => `subjects/${subjectId}`,
        ({ subjectId }: { subjectId: string }) =>
          "subjects/:subjectId" + subjectId
      )({
        will: "u",
        xoo: withParams(
          ({ userId }: { userId: number }) => `users/${userId}`,
          ({ o }: { o: number }) => "a" + o
        ),
      }),
    }),
  }),
});

describe("test add function", () => {
  it("should return correct path created with simple addPrefix", () => {
    expect(links.organizations.create()).toBe("m-admin/organizations/create");
    expect(links.organizations.create.routePath).toBe(
      "mmm/organizations/create"
    );
    expect(links.organizations.edit(5)).toBe("m-admin/organizations/edit/5");
    expect(links.organizations.edit.routePath).toBe(
      "mmm/organizations/edit/:id"
    );
    expect(links.organizations.edit2.routePath(1, 2)).toBe(
      "mmm/organizations/edit/3"
    );
  });

  it("should return correct path created with argument splitting prefixes", () => {
    expect(links.organizations.mash.gg(5)).toBe(
      "m-admin/organizations/ll/5-id/a"
    );
    expect(links.organizations.mash.gg.routePath(13, 4)).toBe(
      "mmm/organizations/ll/:id-17/a"
    );
    expect(links.organizations.mash.laa.asd(1, 4)).toBe(
      "m-admin/organizations/ll/1-id/kl_4/mk"
    );
    expect(
      links.organizations.mash.laa.asd.routePath(3, 5, {
        name: "john",
      })
    ).toBe("mmm/organizations/ll/:id-8/klll_john/mk");
    expect(links.organizations.mash.laa.xla(9, 10, { how: "oo", are: 3 })).toBe(
      "m-admin/organizations/ll/9-id/kl_10/gn-oo-3"
    );
    expect(
      links.organizations.mash.laa.xla.routePath(9, 10, { name: "sadsad" }, 20)
    ).toBe("mmm/organizations/ll/:id-19/klll_sadsad/poo20");
  });

  it("should return correct path created with merging prefixes", () => {
    expect(links.organizations.codoa.laa.routePath).toBe(
      "mmm/organizations/weeks/:weekType/a"
    );
    expect(links.organizations.codoa.laa({ weekType: 2 })).toBe(
      "m-admin/organizations/weeks/2/a"
    );
    expect(links.organizations.codoa.xoo({ weekType: 2, userId: 1 })).toBe(
      "m-admin/organizations/weeks/2/users/1"
    );
    expect(
      links.organizations.codoa.kio.will({
        subjectId: "math",
        weekType: 9,
      })
    ).toBe("m-admin/organizations/weeks/9/subjects/math/u");
    expect(
      links.organizations.codoa.kio.xoo({
        subjectId: "math",
        weekType: 9,
        userId: 100,
      })
    ).toBe("m-admin/organizations/weeks/9/subjects/math/users/100");
  });

  it("should return correct path created with HOF prefixes", () => {
    expect(links.organizations.abaRogor.laa({ weekType: 1 })).toBe(
      "m-admin/organizations/weeks/1/a"
    );
    expect(
      links.organizations.abaRogor.kio222.will({ weekType: 1 })({
        subjectId: "math",
      })
    ).toBe("m-admin/organizations/weeks/1/subjects/math/u");
    expect(
      links.organizations.abaRogor.kio222.xoo({ weekType: 1 })({
        subjectId: "math",
      })({ userId: 90 })
    ).toBe("m-admin/organizations/weeks/1/subjects/math/users/90");
    expect(
      links.organizations.abaRogor.kio.xoo({ weekType: 1 })({
        subjectId: "math",
        userId: 90,
      })
    ).toBe("m-admin/organizations/weeks/1/subjects/math/users/90");
    expect(
      links.organizations.abaRogor.kio.xoo.routePath({
        weekTypeX: 2,
      })({ o: 7, subjectId: "m" })
    ).toBe("mmm/organizations/weeks/:weekType-2/subjects/:subjectIdm/a7");
  });
});
