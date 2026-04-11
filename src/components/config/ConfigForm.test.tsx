import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ConfigForm } from "./ConfigForm";
import { Input, Select } from "@/components/ui";

const testSchema = z.object({
  movies: z.string().min(1, "Movies path is required"),
  targetWidth: z.number().min(360).max(3840),
});

describe("ConfigForm", () => {
  const TestWrapper = ({
    onSubmit,
  }: {
    onSubmit?: (data: unknown) => void;
  }) => {
    const form = useForm({
      resolver: zodResolver(testSchema),
      defaultValues: {
        movies: "",
        targetWidth: 720,
      },
    });

    return (
      <ConfigForm form={form} onSubmit={onSubmit || (() => {})}>
        <Input label="Movies Path" {...form.register("movies")} />
        <Select
          label="Target Width"
          options={[
            { value: "480", label: "480p" },
            { value: "720", label: "720p" },
            { value: "1080", label: "1080p" },
          ]}
          {...form.register("targetWidth", { valueAsNumber: true })}
        />
        <button type="submit">Submit</button>
      </ConfigForm>
    );
  };

  it("renders form fields", () => {
    render(<TestWrapper />);
    expect(screen.getByLabelText("Movies Path")).toBeInTheDocument();
    expect(screen.getByLabelText("Target Width")).toBeInTheDocument();
  });

  it("calls onSubmit with form data", async () => {
    const handleSubmit = vi.fn();
    render(<TestWrapper onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText("Movies Path"), {
      target: { value: "/movies" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ movies: "/movies" }),
        expect.anything()
      );
    });
  });

  it("shows validation errors", async () => {
    const handleSubmit = vi.fn();
    render(<TestWrapper onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText("Movies Path"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(0);
    });
  });

  it("renders children in form", () => {
    render(<TestWrapper />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });
});
