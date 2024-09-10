import {
  useEffect,
  useState
} from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Code,
  SearchSlashIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { WideSkeleton } from '@/components/loading';
import {
  Link,
  useParams
} from 'react-router-dom';
import * as api from "@/lib/api/api";
import * as apitypes from "@/lib/api/types";
import { format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';


const ScreenshotDetail = () => {
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [isNetworkLogOpen, setIsNetworkLogOpen] = useState(true);
  const [isConsoleLogOpen, setIsConsoleLogOpen] = useState(true);
  const [detail, setDetail] = useState<apitypes.detail>();
  const [wappalyzer, setWappalyzer] = useState<apitypes.wappalyzer>({});
  const [loading, setLoading] = useState<boolean>(true);

  const { id } = useParams<{ id: string; }>();
  if (!id) throw new Error("Somehow, detail id is not defined");

  useEffect(() => {
    setLoading(true);
    const getData = async () => {
      try {
        const [detailData, wappalyzerData] = await Promise.all([
          api.get('detail', { id }),
          api.get('wappalyzer')
        ]);
        setDetail(detailData);
        setWappalyzer(wappalyzerData);
      } catch (err) {
        toast({
          title: "API Error",
          variant: "destructive",
          description: `Failed to get detail: ${err}`
        });
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [id]);

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "bg-green-500 text-white";
    if (code >= 400 && code < 500) return "bg-yellow-500 text-black";
    if (code >= 500) return "bg-red-500 text-white";
    return "bg-gray-500 text-white";
  };

  const getLogTypeColor = (type: string) => {
    if (type === 'warn') return "bg-yellow-500 text-black";
    if (type === 'error') return "bg-red-500 text-white";
    return "bg-blue-500 text-white";
  };

  const copyHtmlContent = () => {
    navigator.clipboard.writeText(detail?.html || "")
      .then(() => {
        toast({
          description: "DOM content copied to clipboard"
        });
      })
      .catch(err => {
        console.error('Failed to copy HTML content: ', err);
      });
  };

  const getIconUrl = (tech: string): string | undefined => {
    if (!wappalyzer || !(tech in wappalyzer)) return undefined;

    return wappalyzer[tech];
  };

  if (loading) return <WideSkeleton />;
  if (!detail) return;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Link to={"/screenshot/" + (parseInt(id) - 1).toString()}>
            <Button variant="outline" size="sm" disabled={parseInt(id) <= 1}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          </Link>
          <Link to={"/screenshot/" + (parseInt(id) + 1).toString()}>
            <Button variant="outline" size="sm">
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Button variant="outline" size="sm">
          <SearchSlashIcon className="mr-2 h-4 w-4" />
          Visually Similar
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column */}
        <div className="w-full lg:w-2/5 space-y-4">
          <Card>
            <CardContent className="p-0 relative group">
              <img
                src={api.endpoints.screenshot.path + "/" + detail.file_name}
                alt={detail.title}
                className="w-full h-auto object-cover transition-all duration-300 filter group-hover:scale-105 cursor-pointer rounded-lg"
              />
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-4">
              <div>
                <h2 className="text-xl font-bold">{detail.title}</h2>
                <p className="text-sm text-muted-foreground">{detail.url}</p>
              </div>
              <Button onClick={() => window.open(detail.url, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open URL
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Technologies</CardTitle>
              <Dialog open={isHtmlModalOpen} onOpenChange={setIsHtmlModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={detail.technologies.length === 0}>
                    <Code className="mr-2 h-4 w-4" />
                    View HTML
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>HTML Content</DialogTitle>
                    <DialogDescription>
                      The HTML content of the page is shown below.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[350px] w-full rounded-md border p-4">
                    <pre className="text-sm">{detail.html}</pre>
                  </ScrollArea>
                  <Button onClick={copyHtmlContent}>
                    Copy HTML Content
                  </Button>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {detail.technologies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {detail.technologies.map((tech) => {
                    const iconUrl = getIconUrl(tech.value);
                    return (
                      <div key={tech.id} className="flex items-center space-x-2">
                        {iconUrl && <img src={iconUrl} alt={tech.value} className="w-6 h-6" loading="lazy" />}
                        <span>{tech.value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No technologies detected</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>TLS Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Subject Name:</strong> {detail.tls.subject_name}</p>
              <p><strong>Issuer:</strong> {detail.tls.issuer}</p>
              <p><strong>Protocol:</strong> {detail.tls.protocol}</p>
              <p><strong>Cipher:</strong> {detail.tls.cipher}</p>
              <p><strong>Valid From:</strong> {format(new Date(detail.tls.valid_from * 1000), 'PPP')}</p>
              <p><strong>Valid To:</strong> {format(new Date(detail.tls.valid_to * 1000), 'PPP')}</p>
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">
                  SAN List ({detail.tls.san_list.length})
                </summary>
                <ul className="list-disc pl-5">
                  {detail.tls.san_list.map((san, index) => (
                    <li key={index}>{san.value}</li>
                  ))}
                </ul>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Headers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Header</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.headers.map((header) => (
                    <TableRow key={header.id}>
                      <TableCell className="font-mono text-nowrap">{header.key}</TableCell>
                      <TableCell className="font-mono">{header.value ? header.value : "No Value"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-3/5 space-y-4">
          <Card className="bg-gradient-to-r from-green-600 to-blue-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle >Summary</CardTitle>
              <Badge className={`${getStatusColor(detail.response_code)} px-3 py-1`}>
                HTTP {detail.response_code}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="mb-6 ">
                The final URL was <a href={detail.final_url} target="_blank" rel="noopener noreferrer" className="font-mono underline">
                  {detail.final_url}
                </a> responding with an HTTP <span className="font-mono">{detail.response_code}</span> and <span className="font-mono">{detail.content_length}</span> bytes of content.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">{detail.network.length}</p>
                  <p className="text-sm">Network Requests</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">{detail.console.length}</p>
                  <p className="text-sm">Console Logs</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">{Object.keys(detail.headers).length}</p>
                  <p className="text-sm">Headers</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">{detail.technologies.length}</p>
                  <p className="text-sm">Technologies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {detail.network.length > 0 &&

            <Collapsible open={isNetworkLogOpen} onOpenChange={setIsNetworkLogOpen}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Network Log</CardTitle>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isNetworkLogOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>HTTP</TableHead>
                          <TableHead>URL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.network.map((log, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant="outline" className={`${getStatusColor(log.status_code)} text-xs px-1 py-0`}>
                                {log.status_code}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <a href={log.url} target="_blank" rel="noopener noreferrer" className="break-all">
                                {log.url}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          }

          {detail.console.length > 0 &&
            <Collapsible open={isConsoleLogOpen} onOpenChange={setIsConsoleLogOpen}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Console Logs</CardTitle>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isConsoleLogOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.console.map((log, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant="outline" className={`${getLogTypeColor(log.type)} text-xs px-1 py-0`}>
                                {log.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          }
        </div>
      </div>
    </div>
  );
};

export default ScreenshotDetail;