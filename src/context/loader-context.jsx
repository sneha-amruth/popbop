import { createContext, useContext, useState } from "react";

export const LoaderContext = createContext();

export function LoaderContextProvider({children}){
    const [isLoading, setLoading] = useState(false);
    return(
    <LoaderContext.Provider value={{ isLoading, setLoading }}>
        {children}
    </LoaderContext.Provider>
    )
}

export function useLoader(){
    return useContext(LoaderContext);
}
