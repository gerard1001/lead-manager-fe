"use client";

import Modal from "@/components/Modal";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";

export enum ELeadStatus {
  New = "New",
  Engaged = "Engaged",
  ProposalSent = "Proposal Sent",
  ClosedWon = "Closed-Won",
  ClosedLost = "Closed-Lost",
}

export type TLeadFormInputs = {
  name: string;
  email: string;
  status: ELeadStatus;
};

export type ILead = TLeadFormInputs & {
  _id: string;
};

const schema = Joi.object({
  name: Joi.string().max(20).required().messages({
    "string.empty": "Name is required",
    "string.max": "Name cannot exceed 20 characters",
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email address",
    }),
  status: Joi.string()
    .valid(...Object.values(ELeadStatus))
    .required()
    .messages({ "any.only": "Invalid status" }),
});

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

export default function Home() {
  const [leads, setLeads] = useState<ILead[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TLeadFormInputs>({ resolver: joiResolver(schema) });

  const fetchLeads = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${serverUrl}/leads`);
      const data = await res.json();
      setLeads(data);
    } catch (error: any) {
      setError(error.message as string);
    } finally {
      setFetching(false);
    }
  };

  // Fetch leads on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Reset error on modal close
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  // submit form
  const onSubmit = async (data: TLeadFormInputs) => {
    setLoading(true);
    await fetch(`${serverUrl}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        // close modal, reset form and add new lead to leads
        setOpen(false);
        reset();
        setLeads([...leads, res]);
        setError(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Remove lead
  const removeLead = async (id: string) => {
    // Reset interval to maintain error duration
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!id) return;
    await fetch(`${serverUrl}/leads/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
          setLoading(false);

          // display error for 4 seconds
          intervalRef.current = setInterval(() => {
            setError(null);
            clearInterval(intervalRef.current as NodeJS.Timeout);
          }, 4000);
          return;
        }
        setLeads(leads.filter((lead) => lead._id !== id));
      });
  };

  return (
    <div className="sm:text-lg text-base">
      <main className="w-full max-w-[900px] xl:w-8/12 mb-12 xl:mb-0 px-4 mx-auto mt-24">
        <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded ">
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap items-center">
              <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                <h3 className="font-semibold text-base text-emerald-700">
                  Leads
                </h3>
              </div>
              <div className="relative w-full px-4 max-w-full flex-grow flex-1 text-right">
                <button
                  className="w-fit px-2 py-1 bg-emerald-500 text-white rounded cursor-pointer mt-3 text-base"
                  type="button"
                  onClick={() => setOpen(true)}
                  disabled={loading}
                >
                  Add New
                </button>
              </div>
            </div>
          </div>

          <div className="block w-full overflow-x-auto">
            <table className="items-center bg-transparent w-full border-collapse ">
              <thead>
                <tr>
                  <th className="px-6 bg-emerald-50 text-emerald-500 align-middle border border-solid border-emerald-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Nbr
                  </th>
                  <th className="px-6 bg-emerald-50 text-emerald-500 align-middle border border-solid border-emerald-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Name
                  </th>
                  <th className="px-6 bg-emerald-50 text-emerald-500 align-middle border border-solid border-emerald-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Email
                  </th>
                  <th className="px-6 bg-emerald-50 text-emerald-500 align-middle border border-solid border-emerald-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Status
                  </th>
                  <th className="px-6 bg-emerald-50 text-emerald-500 align-middle border border-solid border-emerald-100 py-3 text-sm uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    {/* Action */}
                  </th>
                </tr>
              </thead>

              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      Fetching...
                    </td>
                  </tr>
                ) : leads?.length ? (
                  leads.map((item, index) => (
                    <tr key={item._id}>
                      <th className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4 text-left text-emerald-700 ">
                        {index + 1}
                      </th>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4 ">
                        {item.name}
                      </td>
                      <td className="border-t-0 px-6 align-center border-l-0 border-r-0 text-sm whitespace-nowrap p-4">
                        {item.email}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4">
                        {item.status}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-sm whitespace-nowrap p-4 flex items-center justify-center">
                        <button
                          onClick={() => removeLead(item._id)}
                          className="p-1 rounded-lg text-gray-400 bg-white hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            x="0px"
                            y="0px"
                            width="20"
                            height="20"
                            viewBox="0 0 128 128"
                          >
                            <path
                              fill="#fff"
                              d="M84,124H44c-11.05,0-20-8.95-20-20V38h80v66C104,115.05,95.05,124,84,124z"
                            ></path>
                            <path
                              fill="#fff"
                              d="M104,38H24c-5.52,0-10-4.48-10-10v0c0-5.52,4.48-10,10-10h80c5.52,0,10,4.48,10,10v0 C114,33.52,109.52,38,104,38z"
                            ></path>
                            <path
                              fill="#444b54"
                              d="M117,28c0-7.17-5.83-13-13-13H24c-7.17,0-13,5.83-13,13s5.83,13,13,13h77v63c0,9.37-7.63,17-17,17H44 c-9.37,0-17-7.63-17-17V52c0-1.66-1.34-3-3-3s-3,1.34-3,3v52c0,12.68,10.32,23,23,23h40c12.68,0,23-10.32,23-23V40.64 C112.72,39.28,117,34.13,117,28z M104,35H24c-3.86,0-7-3.14-7-7s3.14-7,7-7h80c3.86,0,7,3.14,7,7S107.86,35,104,35z"
                            ></path>
                            <path
                              fill="#444b54"
                              d="M79,7H49c-1.66,0-3-1.34-3-3s1.34-3,3-3h30c1.66,0,3,1.34,3,3S80.66,7,79,7z"
                            ></path>
                            <path
                              fill="#50C878"
                              d="M50,107c-1.66,0-3-1.34-3-3V58c0-1.66,1.34-3,3-3s3,1.34,3,3v46C53,105.66,51.66,107,50,107z"
                            ></path>
                            <path
                              fill="#50C878"
                              d="M78,107c-1.66,0-3-1.34-3-3V58c0-1.66,1.34-3,3-3s3,1.34,3,3v46C81,105.66,79.66,107,78,107z"
                            ></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No leads available
                    </td>
                  </tr>
                )}
                {!open && error && (
                  <tr>
                    <td colSpan={4} className="text-red-500 text-xs p-3">
                      <span className="font-semibold">Error:</span> {error}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="w-full flex items-center justify-between">
          <h3 className="font-semibold text-base text-emerald-700">Add Lead</h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-gray-400 bg-white hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="20"
              height="20"
              viewBox="0 0 48 48"
            >
              <path d="M 38.982422 6.9707031 A 2.0002 2.0002 0 0 0 37.585938 7.5859375 L 24 21.171875 L 10.414062 7.5859375 A 2.0002 2.0002 0 0 0 8.9785156 6.9804688 A 2.0002 2.0002 0 0 0 7.5859375 10.414062 L 21.171875 24 L 7.5859375 37.585938 A 2.0002 2.0002 0 1 0 10.414062 40.414062 L 24 26.828125 L 37.585938 40.414062 A 2.0002 2.0002 0 1 0 40.414062 37.585938 L 26.828125 24 L 40.414062 10.414062 A 2.0002 2.0002 0 0 0 38.982422 6.9707031 z"></path>
            </svg>
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col items-start gap-2"
        >
          <div className="w-full">
            <label
              htmlFor="name"
              className="block mb-[1px] text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <div className="relative rounded-md shadow-none">
              <input
                id="name"
                {...register("name")}
                type="text"
                placeholder="Name"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-green focus:border-emerald-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="email"
              className="block mb-[1px] text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="relative rounded-md shadow-none">
              <input
                id="email"
                {...register("email")}
                type="text"
                placeholder="email@test.com"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-green focus:border-emerald-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="status"
              className="block mb-[1px] text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <div className="relative rounded-md shadow-none">
              <select
                id="status"
                {...register("status")}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-green focus:border-emerald-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
              >
                {Object.values(ELeadStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-500 text-xs">{errors.status.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-2 py-1 bg-emerald-500 text-white rounded cursor-pointer mt-3 uppercase"
            disabled={loading}
          >
            {loading ? "Loading..." : "Submit"}
          </button>

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
