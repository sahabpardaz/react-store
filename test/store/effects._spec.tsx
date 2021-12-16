import {
  connectStore,
  Store,
  Effect,
  useStore,
  Observable,
} from "@react-store/core";
import { fireEvent, render, waitFor } from "@testing-library/react";
import React, { ChangeEvent } from "react";
import { clearContainer } from "src/container/container";

export const storeEffectTests = () => {
  beforeEach(() => {
    clearContainer();
  });

  it("must be called when dependencies are being changed", async () => {
    const usernameChangeCallback = jest.fn();
    @Store()
    class UserStore {
      user = { name: "amir.qasemi74" };
      password = "123456";

      changeUsername(e: ChangeEvent<HTMLInputElement>) {
        this.user.name = e.target.value;
      }

      @Effect<UserStore>((_) => [_.user.name])
      onUsernameChange() {
        usernameChangeCallback();
      }
    }

    const User = connectStore(() => {
      const vm = useStore(UserStore);
      return (
        <>
          {vm.user.name}
          {vm.password}
          <input
            data-testid="username-input"
            value={vm.user.name}
            onChange={vm.changeUsername}
          />
        </>
      );
    }, UserStore);

    const { findByTestId } = render(<User />);
    const input = await findByTestId("username-input");

    expect(usernameChangeCallback).toBeCalledTimes(1);

    // change username dep
    await waitFor(() => {
      fireEvent.change(input, { target: { value: "amir.qasemi70" } });
    });
    await waitFor(() => expect(usernameChangeCallback).toBeCalledTimes(2));

    // no change
    await waitFor(() => {
      fireEvent.change(input, { target: { value: "amir.qasemi70" } });
    });
    await waitFor(() => expect(usernameChangeCallback).toBeCalledTimes(2));
    // change username dep again
    await waitFor(() => {
      fireEvent.change(input, { target: { value: "amir.qasemi75" } });
    });
    await waitFor(() => expect(usernameChangeCallback).toBeCalledTimes(3));
  });

  it("clear Effect must be called before running new effect", async () => {
    const usernameChangeCallback = jest.fn();
    const usernameChangeClearEffect = jest.fn();
    const callStack: Array<"effect" | "clear-effect"> = [];

    @Store()
    class UserStore {
      username = "amir.qasemi74";
      password = "123456";

      changeUsername(e: ChangeEvent<HTMLInputElement>) {
        this.username = e.target.value;
      }

      @Effect<UserStore>((_) => [_.username])
      onUsernameChange() {
        usernameChangeCallback();
        callStack.push("effect");
        return () => {
          callStack.push("clear-effect");
          usernameChangeClearEffect();
        };
      }
    }

    const User = connectStore(() => {
      const vm = useStore(UserStore);
      return (
        <>
          {vm.username}
          {vm.password}
          <input
            data-testid="username-input"
            value={vm.username}
            onChange={vm.changeUsername}
          />
        </>
      );
    }, UserStore);

    const { findByTestId } = render(<User />);
    const input = await findByTestId("username-input");

    expect(usernameChangeCallback).toBeCalledTimes(1);
    expect(usernameChangeClearEffect).toBeCalledTimes(0);
    expect(callStack).toEqual(["effect"]);

    // change username dep
    await waitFor(() => {
      fireEvent.change(input, { target: { value: "amir.qasemi70" } });
    });
    await waitFor(() => expect(usernameChangeCallback).toBeCalledTimes(2));
    expect(usernameChangeClearEffect).toBeCalledTimes(1);
    expect(callStack).toEqual(["effect", "clear-effect", "effect"]);

    // no change
    await waitFor(() => {
      fireEvent.change(input, { target: { value: "amir.qasemi70" } });
    });
    expect(usernameChangeCallback).toBeCalledTimes(2);
    expect(usernameChangeClearEffect).toBeCalledTimes(1);
    expect(callStack).toEqual(["effect", "clear-effect", "effect"]);

    // change username dep again
    await waitFor(() => {
      fireEvent.change(input, { target: { value: "amir.qasemi75" } });
    });
    await waitFor(() => expect(usernameChangeCallback).toBeCalledTimes(3));
    expect(usernameChangeClearEffect).toBeCalledTimes(2);
    expect(callStack).toEqual([
      "effect",
      "clear-effect",
      "effect",
      "clear-effect",
      "effect",
    ]);
  });

  it("should run effect for observable class instance change in deep equal mode", async () => {
    @Observable()
    class User {
      name = "amir.qasemi74";
    }

    const onUserChangeCB = jest.fn();
    @Store()
    class UserStore {
      user = new User();

      changeUsername(e: ChangeEvent<HTMLInputElement>) {
        this.user.name = e.target.value;
      }

      @Effect<UserStore>((_) => [_.user], true)
      onUserChange() {
        onUserChangeCB();
      }
    }

    const App = connectStore(() => {
      const vm = useStore(UserStore);
      return (
        <>
          {vm.user.name}
          <input
            data-testid="username-input"
            value={vm.user.name}
            onChange={vm.changeUsername}
          />
        </>
      );
    }, UserStore);

    const { getByTestId } = render(<App />);

    expect(onUserChangeCB).toBeCalledTimes(1);

    fireEvent.change(getByTestId("username-input"), {
      target: { value: "amir.qasemi70" },
    });
    expect(onUserChangeCB).toBeCalledTimes(2);
  });
};
